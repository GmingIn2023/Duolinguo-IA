import { getQuestion } from "@/content";
import type { Answer } from "@/content/types";
import { gradeAnswer } from "./grading";
import type { AwardResult, ProgressDb, ReviewWrite, XpSource } from "./progressDb";
import { REPLAY_WINDOW_HOURS, reviewPassed, srsUpdate } from "./progressRules";
import { nextStreak, todayKey } from "./streak";
import type { LessonResult, ReviewMode, ReviewResult } from "./types";
import { isoWeekKey } from "./weekly";
import { CHECKPOINT_BONUS_XP, lessonXp, reviewXp, WEEKLY_BONUS_XP } from "./xp";

/**
 * The progress rules (XP, lesson progress, spaced repetition, bonuses), apart from Next.js and Supabase:
 * everything is reached through a ProgressDb, so the rules can be tested, including simultaneous requests.
 */

/** The signed-in learner as far as the rules need: id, streak state and running XP. Updated in place after each award. */
export type Learner = { id: string; streakDays: number; lastActiveDate: string | null; xp?: number };

export type Graded = { questionId: string; lessonId: string; correct: boolean };
export type GradedAnswer = { target: { questionId: string; lessonId: string }; ok: boolean };

/** Credits XP through the database (atomic) and keeps the learner's streak state coherent for the next award in the same request. */
async function award(db: ProgressDb, learner: Learner, amount: number, source: XpSource, ref: string, replayHours: number, today: string): Promise<AwardResult> {
  const result = await db.awardXp({
    userId: learner.id,
    amount,
    source,
    ref,
    streak: nextStreak(learner.streakDays, learner.lastActiveDate, today),
    today,
    replayHours,
  });
  if (result.awarded) learner.lastActiveDate = today;
  learner.streakDays = result.streak;
  learner.xp = result.totalXp;
  return result;
}

/**
 * Updates the spaced-repetition boxes for the graded notions and returns the notions that were really updated.
 * - normal mode: absolute states are written, so two identical requests leave the same rows (idempotent);
 * - exclusive mode (daily review): each notion is claimed with a compare-and-swap (same box, still due),
 *   so when two requests answer the same notions at once, each notion is applied, and paid, once.
 */
export async function scheduleReviews(db: ProgressDb, userId: string, graded: Graded[], now: Date, opts: { exclusive?: boolean } = {}): Promise<Set<string>> {
  const applied = new Set<string>();
  if (!graded.length) return applied;
  const existing = new Map((await db.getReviewItems(userId, graded.map((g) => g.questionId))).map((r) => [r.question_id, r]));
  const rows: ReviewWrite[] = [];
  for (const g of graded) {
    const prev = existing.get(g.questionId) ?? null;
    const state = srsUpdate(prev ? { box: prev.box, lapses: prev.lapses, due_at: prev.due_at } : null, g.correct, now);
    if (!state) continue; // a right answer on a notion that is not due yet changes nothing
    const row: ReviewWrite = { question_id: g.questionId, lesson_id: g.lessonId, box: state.box, lapses: state.lapses, due_at: state.dueAt.toISOString(), last_reviewed_at: now.toISOString() };
    if (opts.exclusive) {
      // only a notion that is due can be answered in a daily review; anything else was already taken by another request
      if (!prev || new Date(prev.due_at).getTime() > now.getTime()) continue;
      if (await db.claimReviewItem(userId, { question_id: g.questionId, box: prev.box, dueBefore: now.toISOString() }, row)) applied.add(g.questionId);
    } else {
      rows.push(row);
      applied.add(g.questionId);
    }
  }
  await db.upsertReviewItems(userId, rows);
  return applied;
}

/**
 * Records a finished lesson: best score, attempts and XP earned. Written with an optimistic compare-and-swap on `attempts`,
 * so simultaneous validations are merged instead of overwriting each other. Returns the row that existed before
 * (null for a first completion).
 */
async function saveLessonProgress(db: ProgressDb, userId: string, lessonId: string, score: number, paid: number, nowIso: string) {
  for (let turn = 0; turn < 8; turn++) {
    const prev = await db.getLessonProgress(userId, lessonId);
    if (!prev) {
      if (await db.insertLessonProgress(userId, lessonId, { best_score: score, attempts: 1, xp_earned: paid, first_completed_at: nowIso, last_completed_at: nowIso })) return null;
      continue; // another request created the row first: merge into it on the next turn
    }
    const next = { best_score: Math.max(prev.best_score, score), attempts: prev.attempts + 1, xp_earned: prev.xp_earned + paid, last_completed_at: nowIso };
    if (await db.updateLessonProgress(userId, lessonId, prev.attempts, next)) return prev;
  }
  throw new Error("Ta progression n'a pas pu être enregistrée : trop de validations en même temps. Réessaie.");
}

export async function completeLessonCore(
  db: ProgressDb,
  learner: Learner,
  lesson: { id: string; xp: number },
  graded: Graded[],
  now = new Date(),
  today = todayKey(),
): Promise<LessonResult> {
  const correct = graded.filter((g) => g.correct).length;
  const total = graded.length;
  const score = Math.round((correct / total) * 100);

  const before = await db.getLessonProgress(learner.id, lesson.id);
  // The XP is credited first. The database decides atomically whether this lesson was already paid inside the replay
  // window, so a scripted loop, or two requests sent at once, cannot be paid twice.
  const intended = lessonXp({ baseXp: lesson.xp, correct, total, alreadyCompleted: Boolean(before) });
  const paid = await award(db, learner, intended, "lesson", lesson.id, REPLAY_WINDOW_HOURS, today);
  const prev = await saveLessonProgress(db, learner.id, lesson.id, score, paid.paid, now.toISOString());
  await scheduleReviews(db, learner.id, graded, now);
  return { correct, total, score, xpEarned: paid.paid, totalXp: paid.totalXp, streak: paid.streak, firstCompletion: !prev };
}

/** The scheduled notion a served question stands for: a review form maps back to the quiz question of the same concept. */
function scheduledFor(servedId: string): { questionId: string; lessonId: string } | null {
  const found = getQuestion(servedId);
  if (!found) return null;
  const { question, lesson, pool } = found;
  if (pool === "quiz") return { questionId: servedId, lessonId: lesson.id };
  const base = question.concept ? lesson.questions.find((q) => q.concept === question.concept) : undefined;
  return { questionId: (base ?? question).id, lessonId: lesson.id };
}

/** Grades the first answers of a review session, keeping only the questions this learner may be graded on. */
export function gradeReviewAnswers(firstAnswers: Record<string, Answer>, allowed: Set<string>): GradedAnswer[] {
  const out: GradedAnswer[] = [];
  for (const [servedId, answer] of Object.entries(firstAnswers)) {
    const found = getQuestion(servedId);
    const target = scheduledFor(servedId);
    if (!found || !target || !allowed.has(servedId)) continue;
    out.push({ target, ok: gradeAnswer(found.question, answer) });
  }
  return out;
}

export async function submitReviewCore(
  db: ProgressDb,
  learner: Learner,
  input: { mode: ReviewMode; answers: GradedAnswer[]; expected: number },
  now = new Date(),
  today = todayKey(),
): Promise<ReviewResult> {
  const { mode, answers, expected } = input;
  if (!answers.length) throw new Error("Aucune réponse à enregistrer.");
  const total = answers.length;
  const correct = answers.filter((a) => a.ok).length;

  // one verdict per scheduled notion: missed if any of its forms was missed
  const verdicts = new Map<string, Graded>();
  for (const a of answers) {
    const prev = verdicts.get(a.target.questionId);
    verdicts.set(a.target.questionId, { questionId: a.target.questionId, lessonId: a.target.lessonId, correct: a.ok && (prev?.correct ?? true) });
  }

  const daily = mode === "daily";
  const applied = await scheduleReviews(db, learner.id, [...verdicts.values()], now, { exclusive: daily });
  // A daily review pays only the notions this request really took: a duplicate of the same submission, sent at the same
  // time, takes none of them and earns nothing. The weekly plan and checkpoints pay once per window (decided in the database).
  const paying = daily ? answers.filter((a) => a.ok && applied.has(a.target.questionId)).length : correct;
  const replayable = !daily;
  // A checkpoint or a weekly review is "passed" with enough right answers on enough answered questions.
  // Anything less still pays its review XP, but earns neither the passed marker nor the bonus.
  const passed = !replayable || reviewPassed({ correct, answered: total, expected });
  // The "checkpoint:<id>" ref is what marks a checkpoint as passed: an unpassed attempt is logged under its own ref.
  const reviewRef = passed ? mode : `try:${mode}`;
  const paidReview = await award(db, learner, reviewXp(paying), "review", reviewRef, replayable ? REPLAY_WINDOW_HOURS : 0, today);
  let bonus = 0;
  let totals: AwardResult = paidReview;

  if (passed && mode === "weekly") {
    // paid once per ISO week: the database refuses a second claim
    const paid = await award(db, learner, WEEKLY_BONUS_XP, "weekly", isoWeekKey(now), 0, today);
    if (paid.awarded) bonus = WEEKLY_BONUS_XP;
    totals = paid;
  } else if (passed && replayable) {
    // paid once per checkpoint: a unique index makes concurrent submissions unable to claim it twice
    const paid = await award(db, learner, CHECKPOINT_BONUS_XP, "checkpoint", mode, 0, today);
    if (paid.awarded) bonus = CHECKPOINT_BONUS_XP;
    totals = paid;
  }
  return { correct, total, expected, passed, xpEarned: paidReview.paid, bonus, totalXp: totals.totalXp, streak: totals.streak };
}
