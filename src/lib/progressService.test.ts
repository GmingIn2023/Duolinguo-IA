import { beforeEach, describe, expect, it } from "vitest";
import { LESSONS, getQuestion } from "@/content";
import type { Answer, Question } from "@/content/types";
import { isGraded } from "./grading";
import { completeLessonCore, dailyRef, gradeReviewAnswers, savedDailyReview, scheduleReviews, staleDailyReview, submitReviewCore, type GradedAnswer, type Graded, type Learner } from "./progressService";
import { initialOrder } from "./quizOrder";
import { checkpointQuestions, serveItems, targetsOf, targetsOfQuestions } from "./reviewServe";
import { FakeProgressDb } from "./testing/fakeProgressDb";
import { CHECKPOINT_BONUS_XP, WEEKLY_BONUS_XP } from "./xp";

/**
 * Tests of the progress rules (XP, lesson progress, spaced repetition, bonuses) against an in-memory MODEL of the database.
 * They prove the TypeScript logic, including simultaneous requests. They do not prove the SQL: see supabase/tests.
 */

const NOW = new Date("2026-10-17T10:00:00Z");
const TODAY = "2026-10-17";
const LESSON = { id: "premier-prompt", xp: 40 };
const hours = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

let db: FakeProgressDb;
const learner = (id = "u1", over: Partial<Learner> = {}): Learner => ({ id, streakDays: 0, lastActiveDate: null, xp: 0, ...over });
const graded = (right: number, total = 5): Graded[] => Array.from({ length: total }, (_, i) => ({ questionId: `${LESSON.id}-q${i}`, lessonId: LESSON.id, correct: i < right }));
const answers = (ids: string[], ok = true): GradedAnswer[] => ids.map((q) => ({ target: { questionId: q, lessonId: LESSON.id }, ok }));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

beforeEach(() => {
  db = new FakeProgressDb();
});

describe("completing a lesson", () => {
  it("pays a first completion in full, then nothing for an immediate replay, then a small reward after the window", async () => {
    const l = learner();
    const first = await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY);
    expect(first.xpEarned).toBe(40);
    expect(first.firstCompletion).toBe(true);

    const replay = await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY);
    expect(replay.xpEarned).toBe(0);
    expect(replay.firstCompletion).toBe(false);
    expect(replay.totalXp).toBe(40);

    db.clock += 21 * 3_600_000; // past the 20 h window
    const later = await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY);
    expect(later.xpEarned).toBe(8); // a replay earns 20 %
    expect(db.progress("u1", LESSON.id)).toMatchObject({ attempts: 3, xp_earned: 48, best_score: 100 });
  });

  it("scores by first-try accuracy and keeps the best score", async () => {
    const l = learner();
    await completeLessonCore(db, l, LESSON, graded(3), NOW, TODAY);
    await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY);
    await completeLessonCore(db, l, LESSON, graded(1), NOW, TODAY);
    expect(db.progress("u1", LESSON.id)?.best_score).toBe(100);
  });

  it("two completions sent at the same time pay once and lose no attempt", async () => {
    const [a, b] = await Promise.all([completeLessonCore(db, learner(), LESSON, graded(5), NOW, TODAY), completeLessonCore(db, learner(), LESSON, graded(5), NOW, TODAY)]);
    expect(sum([a.xpEarned, b.xpEarned])).toBe(40);
    expect(db.paidTotal("u1", "lesson", LESSON.id)).toBe(40);
    expect(db.profiles.get("u1")?.xp).toBe(40);
    // both attempts are recorded and the XP shown on the lesson is what was really paid
    expect(db.progress("u1", LESSON.id)).toMatchObject({ attempts: 2, xp_earned: 40 });
    // exactly one of them was the first completion
    expect([a.firstCompletion, b.firstCompletion].filter(Boolean)).toHaveLength(1);
  });

  it("five completions at once with different scores: one payment, five attempts, the best score kept", async () => {
    const results = await Promise.all([5, 4, 3, 2, 1].map((right) => completeLessonCore(db, learner(), LESSON, graded(right), NOW, TODAY)));
    expect(db.paidTotal("u1")).toBe(sum(results.map((r) => r.xpEarned)));
    expect(db.events.filter((e) => e.amount > 0)).toHaveLength(1);
    expect(db.progress("u1", LESSON.id)).toMatchObject({ attempts: 5, best_score: 100 });
    expect(db.progress("u1", LESSON.id)?.xp_earned).toBe(db.paidTotal("u1", "lesson", LESSON.id));
    expect(results.filter((r) => r.firstCompletion)).toHaveLength(1);
  });

  it("other learners are not affected by each other", async () => {
    const results = await Promise.all([completeLessonCore(db, learner("a"), LESSON, graded(5), NOW, TODAY), completeLessonCore(db, learner("b"), LESSON, graded(5), NOW, TODAY)]);
    expect(results.map((r) => r.xpEarned)).toEqual([40, 40]);
  });

  it("a failure while recording the progress keeps no XP and no event, and the retry is a clean first completion", async () => {
    const l = learner();
    db.failNextCompleteLesson = "progress";
    await expect(completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY)).rejects.toThrow(/progress write failed/);
    expect(db.paidTotal("u1")).toBe(0);
    expect(db.events).toHaveLength(0);
    expect(db.progress("u1", LESSON.id)).toBeUndefined();
    expect(l.xp).toBe(0); // the in-memory learner is not advanced by a failed call
    const retry = await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY);
    expect(retry).toMatchObject({ xpEarned: 40, firstCompletion: true, totalXp: 40 });
    expect(db.progress("u1", LESSON.id)).toMatchObject({ attempts: 1, xp_earned: 40 });
  });

  it("a failure while awarding the XP records no progress either", async () => {
    db.failNextCompleteLesson = "award";
    await expect(completeLessonCore(db, learner(), LESSON, graded(5), NOW, TODAY)).rejects.toThrow(/award failed/);
    expect(db.progress("u1", LESSON.id)).toBeUndefined();
    expect(db.events).toHaveLength(0);
  });

  it("profile total, XP events and lesson_progress.xp_earned always agree", async () => {
    const l = learner();
    await Promise.all([5, 3, 4].map((right) => completeLessonCore(db, learner(), LESSON, graded(right), NOW, TODAY)));
    db.clock += 21 * 3_600_000;
    await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY);
    db.failNextCompleteLesson = "progress";
    await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY).catch(() => undefined);
    const total = db.profiles.get("u1")!.xp;
    expect(total).toBe(db.paidTotal("u1"));
    expect(total).toBe(db.progress("u1", LESSON.id)!.xp_earned);
  });

  it("canary: the OLD two-step design (award, then write the progress) DOES leave XP without progress when the second step fails", async () => {
    await db.awardXp({ userId: "u1", amount: 40, source: "lesson", ref: LESSON.id, streak: 1, today: TODAY, replayHours: 20 });
    // ...the progress write fails here: nothing was recorded for the lesson, yet the XP is kept
    expect(db.paidTotal("u1")).toBe(40);
    expect(db.progress("u1", LESSON.id)).toBeUndefined();
  });

  it("rejects out-of-range values the way the database does", async () => {
    await expect(db.completeLesson({ userId: "u1", lessonId: "x", xpFirst: 501, xpRepeat: 1, score: 50, streak: 1, today: TODAY, replayHours: 20 })).rejects.toThrow(/amount out of range/);
    await expect(db.completeLesson({ userId: "u1", lessonId: "x", xpFirst: 5, xpRepeat: 1, score: 101, streak: 1, today: TODAY, replayHours: 20 })).rejects.toThrow(/score out of range/);
  });
});

describe("streaks", () => {
  it("increments on a new day, holds within a day and restarts after a gap", async () => {
    const l = learner("u1", { streakDays: 3, lastActiveDate: "2026-10-16", xp: 0 });
    const r1 = await completeLessonCore(db, l, LESSON, graded(5), NOW, "2026-10-17");
    expect(r1.streak).toBe(4);
    const r2 = await completeLessonCore(db, l, LESSON, graded(5), NOW, "2026-10-17");
    expect(r2.streak).toBe(4); // same day: no second increment
    const gap = learner("g", { streakDays: 9, lastActiveDate: "2026-10-10" });
    expect((await completeLessonCore(db, gap, LESSON, graded(5), NOW, "2026-10-17")).streak).toBe(1);
    expect(learner("n").streakDays).toBe(0);
    const fresh = learner("f");
    expect((await completeLessonCore(db, fresh, LESSON, graded(5), NOW, "2026-10-17")).streak).toBe(1);
  });

  it("a review in the same request as a bonus does not count the day twice", async () => {
    const l = learner("u1", { streakDays: 2, lastActiveDate: "2026-10-16" });
    const r = await submitReviewCore(db, l, { mode: "weekly", answers: answers(["a", "b", "c", "d", "e"]), expected: 5 }, NOW, "2026-10-17");
    expect(r.bonus).toBe(WEEKLY_BONUS_XP);
    expect(r.streak).toBe(3);
    expect(l.streakDays).toBe(3);
    expect(l.lastActiveDate).toBe("2026-10-17");
  });
});

describe("spaced repetition", () => {
  const seed = (id: string, box: number, dueInHours: number, lapses = 0) => db.seedReview("u1", { question_id: id, lesson_id: LESSON.id, box, lapses, due_at: hours(dueInHours) });

  it("schedules a new notion: box 2 when right, box 1 when missed", async () => {
    await scheduleReviews(db, "u1", [{ questionId: "n1", lessonId: LESSON.id, correct: true }, { questionId: "n2", lessonId: LESSON.id, correct: false }], NOW);
    expect(db.review("u1", "n1")?.box).toBe(2);
    expect(db.review("u1", "n2")?.box).toBe(1);
  });

  it("replaying a lesson five times does not push a notion up", async () => {
    seed("q1", 2, 48);
    for (let i = 0; i < 5; i++) await scheduleReviews(db, "u1", [{ questionId: "q1", lessonId: LESSON.id, correct: true }], NOW);
    expect(db.review("u1", "q1")).toMatchObject({ box: 2, due_at: hours(48) });
  });

  it("promotes a notion that is due, and a miss always resets it", async () => {
    seed("q1", 2, -1);
    seed("q2", 5, 100, 1);
    await scheduleReviews(db, "u1", [{ questionId: "q1", lessonId: LESSON.id, correct: true }, { questionId: "q2", lessonId: LESSON.id, correct: false }], NOW);
    expect(db.review("u1", "q1")?.box).toBe(3);
    expect(db.review("u1", "q2")).toMatchObject({ box: 1, lapses: 2 });
  });

  it("two identical normal-mode requests leave the same rows (idempotent)", async () => {
    seed("q1", 2, -1);
    await Promise.all([1, 2].map(() => scheduleReviews(db, "u1", [{ questionId: "q1", lessonId: LESSON.id, correct: true }], NOW)));
    expect(db.review("u1", "q1")?.box).toBe(3);
  });
});

describe("daily review", () => {
  beforeEach(() => {
    for (const id of ["d1", "d2", "d3"]) db.seedReview("u1", { question_id: id, lesson_id: LESSON.id, box: 2, lapses: 0, due_at: hours(-1) });
  });

  it("pays 2 XP per right notion and moves each notion up once", async () => {
    const r = await submitReviewCore(db, learner(), { mode: "daily", answers: answers(["d1", "d2", "d3"]), expected: 3 }, NOW, TODAY);
    expect(r.xpEarned).toBe(6);
    expect(r.passed).toBe(true);
    expect(["d1", "d2", "d3"].map((id) => db.review("u1", id)?.box)).toEqual([3, 3, 3]);
  });

  it("the same submission sent twice at once is paid once and promotes each notion once", async () => {
    const run = () => submitReviewCore(db, learner(), { mode: "daily", answers: answers(["d1", "d2", "d3"]), expected: 3 }, NOW, TODAY);
    const [a, b] = await Promise.all([run(), run()]);
    expect(sum([a.xpEarned, b.xpEarned])).toBe(6);
    expect(db.paidTotal("u1")).toBe(6);
    expect(["d1", "d2", "d3"].map((id) => db.review("u1", id)?.box)).toEqual([3, 3, 3]);
    expect(db.refusedWrites).toBeGreaterThan(0);
  });

  it("five copies at once are still paid once", async () => {
    const run = () => submitReviewCore(db, learner(), { mode: "daily", answers: answers(["d1", "d2", "d3"]), expected: 3 }, NOW, TODAY);
    const results = await Promise.all([run(), run(), run(), run(), run()]);
    expect(sum(results.map((r) => r.xpEarned))).toBe(6);
    expect(db.profiles.get("u1")?.xp).toBe(6);
  });

  it("overlapping submissions pay each notion once", async () => {
    const [a, b] = await Promise.all([
      submitReviewCore(db, learner(), { mode: "daily", answers: answers(["d1", "d2"]), expected: 3 }, NOW, TODAY),
      submitReviewCore(db, learner(), { mode: "daily", answers: answers(["d2", "d3"]), expected: 3 }, NOW, TODAY),
    ]);
    expect(sum([a.xpEarned, b.xpEarned])).toBe(6); // d1, d2, d3 once each
    expect(["d1", "d2", "d3"].map((id) => db.review("u1", id)?.box)).toEqual([3, 3, 3]);
  });

  it("a miss counts one lapse even when the duplicate also reports it", async () => {
    const run = () => submitReviewCore(db, learner(), { mode: "daily", answers: answers(["d1"], false), expected: 3 }, NOW, TODAY);
    await Promise.all([run(), run()]);
    expect(db.review("u1", "d1")).toMatchObject({ box: 1, lapses: 1 });
  });

  it("a later duplicate, once the notions are no longer due, earns nothing and changes nothing", async () => {
    await submitReviewCore(db, learner(), { mode: "daily", answers: answers(["d1", "d2", "d3"]), expected: 3 }, NOW, TODAY);
    const again = await submitReviewCore(db, learner(), { mode: "daily", answers: answers(["d1", "d2", "d3"]), expected: 3 }, NOW, TODAY);
    expect(again.xpEarned).toBe(0);
    expect(["d1", "d2", "d3"].map((id) => db.review("u1", id)?.box)).toEqual([3, 3, 3]);
  });

  it("refuses an empty submission", async () => {
    await expect(submitReviewCore(db, learner(), { mode: "daily", answers: [], expected: 3 }, NOW, TODAY)).rejects.toThrow("Aucune réponse");
  });
});

describe("weekly review and checkpoints", () => {
  const ten = Array.from({ length: 10 }, (_, i) => `w${i}`);
  const mixed = (right: number): GradedAnswer[] => ten.map((q, i) => ({ target: { questionId: q, lessonId: LESSON.id }, ok: i < right }));

  it("a passed weekly review pays its XP and the bonus once per week", async () => {
    const r = await submitReviewCore(db, learner(), { mode: "weekly", answers: mixed(8), expected: 10 }, NOW, TODAY);
    expect(r).toMatchObject({ passed: true, xpEarned: 16, bonus: WEEKLY_BONUS_XP, correct: 8, total: 10, expected: 10 });
    const again = await submitReviewCore(db, learner(), { mode: "weekly", answers: mixed(8), expected: 10 }, NOW, TODAY);
    expect(again.bonus).toBe(0);
    expect(again.xpEarned).toBe(0); // same session replayed inside the window
  });

  it("two weekly submissions at once pay the bonus and the review XP once", async () => {
    const run = () => submitReviewCore(db, learner(), { mode: "weekly", answers: mixed(10), expected: 10 }, NOW, TODAY);
    const results = await Promise.all([run(), run(), run()]);
    expect(sum(results.map((r) => r.bonus))).toBe(WEEKLY_BONUS_XP);
    expect(sum(results.map((r) => r.xpEarned))).toBe(20);
    expect(db.paidTotal("u1")).toBe(20 + WEEKLY_BONUS_XP);
  });

  it("a failed checkpoint is not marked as passed and pays no bonus; a later pass does", async () => {
    const fail = await submitReviewCore(db, learner(), { mode: "checkpoint:c1", answers: mixed(3), expected: 10 }, NOW, TODAY);
    expect(fail).toMatchObject({ passed: false, bonus: 0, xpEarned: 6 });
    // "passed" is read from review events whose ref starts with "checkpoint:": the failed try must not match
    expect(db.events.some((e) => e.source === "review" && e.ref.startsWith("checkpoint:"))).toBe(false);
    expect(db.events.some((e) => e.ref === "try:checkpoint:c1")).toBe(true);
    expect(db.events.some((e) => e.source === "checkpoint")).toBe(false);

    const pass = await submitReviewCore(db, learner(), { mode: "checkpoint:c1", answers: mixed(10), expected: 10 }, NOW, TODAY);
    expect(pass).toMatchObject({ passed: true, bonus: CHECKPOINT_BONUS_XP, xpEarned: 20 });
    expect(db.events.some((e) => e.source === "review" && e.ref === "checkpoint:c1")).toBe(true);
  });

  it("a checkpoint bonus is paid once even with simultaneous passes", async () => {
    const run = () => submitReviewCore(db, learner(), { mode: "checkpoint:c1", answers: mixed(10), expected: 10 }, NOW, TODAY);
    const results = await Promise.all([run(), run()]);
    expect(sum(results.map((r) => r.bonus))).toBe(CHECKPOINT_BONUS_XP);
  });

  it("one lucky answer out of ten is not a passed checkpoint (partial or forged submission)", async () => {
    const r = await submitReviewCore(db, learner(), { mode: "checkpoint:c1", answers: mixed(1).slice(0, 1), expected: 10 }, NOW, TODAY);
    expect(r.passed).toBe(false);
    expect(r.bonus).toBe(0);
  });

  it("a replayed checkpoint inside the window pays no review XP again", async () => {
    await submitReviewCore(db, learner(), { mode: "checkpoint:c1", answers: mixed(10), expected: 10 }, NOW, TODAY);
    const again = await submitReviewCore(db, learner(), { mode: "checkpoint:c1", answers: mixed(10), expected: 10 }, NOW, TODAY);
    expect(again).toMatchObject({ xpEarned: 0, bonus: 0 });
  });
});

describe("grading a review session with the real course content", () => {
  const quiz = LESSONS.flatMap((l) => l.questions).find((q): q is Extract<Question, { type: "mcq" }> => q.type === "mcq")!;
  const wrongOption = quiz.options.find((o) => o.id !== quiz.answer)!.id;
  const self = new Map([[quiz.id, { questionId: quiz.id, lessonId: "x" }]]);

  it("grades the first answer of a served question against its scheduled notion", () => {
    expect(gradeReviewAnswers({ [quiz.id]: quiz.answer }, self)).toEqual([{ target: { questionId: quiz.id, lessonId: "x" }, ok: true }]);
    expect(gradeReviewAnswers({ [quiz.id]: wrongOption }, self)[0].ok).toBe(false);
  });

  it("ignores questions the learner may not be graded on, and unknown ids", () => {
    expect(gradeReviewAnswers({ [quiz.id]: quiz.answer }, new Map())).toEqual([]);
    expect(gradeReviewAnswers({ "does-not-exist": "a" as Answer }, new Map([["does-not-exist", { questionId: "q", lessonId: "l" }]]))).toEqual([]);
  });

  it("in a chapter review, a review form maps back to the quiz question of the same concept", () => {
    const lesson = LESSONS.find((l) => l.reviewQuestions.some((r) => r.concept && l.questions.some((q) => q.concept === r.concept)))!;
    const form = lesson.reviewQuestions.find((r) => r.concept && lesson.questions.some((q) => q.concept === r.concept))!;
    const base = lesson.questions.find((q) => q.concept === form.concept)!;
    const out = gradeReviewAnswers({ [form.id]: "x" as Answer }, targetsOfQuestions([form]));
    expect(out).toHaveLength(1);
    expect(out[0].target).toEqual({ questionId: base.id, lessonId: lesson.id });
    expect(getQuestion(form.id)?.pool).not.toBe("quiz");
  });
});

/** The answer that is right for any graded question. */
function rightAnswer(q: Question): Answer {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
    case "true_false":
      return q.answer;
    case "sort":
      return q.answer.map(String);
    case "written":
      return q.modelAnswer;
    default:
      return q.answer;
  }
}

describe("regression: notions that stayed due forever (two quiz questions sharing a concept)", () => {
  // every pair of quiz questions of one lesson that test the same concept AND have a review form: the form used to be
  // credited to the first question only, so the second one came back every day, was never updated and paid nothing
  const pairs = LESSONS.flatMap((l) => {
    const byConcept = new Map<string, Question[]>();
    for (const q of l.questions.filter(isGraded)) if (q.concept) byConcept.set(q.concept, [...(byConcept.get(q.concept) ?? []), q]);
    return [...byConcept.entries()]
      .filter(([concept, qs]) => qs.length > 1 && l.reviewQuestions.some((r) => r.concept === concept))
      .map(([concept, qs]) => ({ lesson: l, concept, qs }));
  });

  it("the course really contains such pairs (otherwise this suite proves nothing)", () => {
    expect(pairs.length).toBeGreaterThanOrEqual(8);
  });

  it("serves one distinct question per scheduled notion, at every box, and maps each back to its own notion", () => {
    for (const { qs } of pairs) {
      for (let box = 1; box <= 6; box++) {
        const served = serveItems(qs.map((q) => ({ question_id: q.id, box })));
        expect(served.map((s) => s.scheduledId), `${qs[0].id} box ${box}`).toEqual(qs.map((q) => q.id));
        expect(new Set(served.map((s) => s.question.id)).size).toBe(qs.length);
        const targets = targetsOf(served);
        expect([...targets.values()].map((t) => t.questionId).sort()).toEqual(qs.map((q) => q.id).sort());
      }
    }
  });

  it("every graded quiz question of the whole course can be served and credited to itself, alone or with its lesson", () => {
    for (const l of LESSONS) {
      const quiz = l.questions.filter(isGraded);
      for (let box = 1; box <= 6; box++) {
        const served = serveItems(quiz.map((q) => ({ question_id: q.id, box })));
        expect(served.map((s) => s.scheduledId), `${l.id} box ${box}`).toEqual(quiz.map((q) => q.id));
        expect([...targetsOf(served).values()].map((t) => t.questionId)).toEqual(quiz.map((q) => q.id));
      }
    }
  });

  it("a daily review answered right moves BOTH notions up and leaves nothing due", async () => {
    const { lesson, qs } = pairs[0];
    for (const q of qs) db.seedReview("u1", { question_id: q.id, lesson_id: lesson.id, box: 2, lapses: 0, due_at: hours(-1) });
    const served = serveItems(qs.map((q) => ({ question_id: q.id, box: 2 })));
    const first = Object.fromEntries(served.map((s) => [s.question.id, rightAnswer(s.question)]));
    const r = await submitReviewCore(db, learner(), { mode: "daily", answers: gradeReviewAnswers(first, targetsOf(served)), expected: served.length }, NOW, TODAY);
    expect(r).toMatchObject({ correct: qs.length, total: qs.length, xpEarned: 2 * qs.length });
    for (const q of qs) {
      expect(db.review("u1", q.id)?.box, q.id).toBe(3);
      expect(Date.parse(db.review("u1", q.id)!.due_at)).toBeGreaterThan(NOW.getTime());
    }
  });

  it("over 40 days of daily reviews, no notion of these lessons stays stuck in the due list", async () => {
    const lessons = [...new Set(pairs.map((p) => p.lesson))];
    const all = lessons.flatMap((l) => l.questions.filter(isGraded).map((q) => ({ q, lessonId: l.id })));
    for (const { q, lessonId } of all) db.seedReview("u1", { question_id: q.id, lesson_id: lessonId, box: 1, lapses: 0, due_at: hours(-1) });
    const l = learner();
    let maxDueStreak = 0;
    const dueDays = new Map<string, number>();
    for (let day = 0; day < 40; day++) {
      const now = new Date(NOW.getTime() + day * 86_400_000);
      // several sessions a day, 12 notions each, until nothing is due (the page serves the 12 most overdue)
      for (let session = 0; session < 20; session++) {
        const due = all
          .map(({ q }) => db.review("u1", q.id)!)
          .filter((row) => Date.parse(row.due_at) <= now.getTime())
          .sort((a, b) => a.due_at.localeCompare(b.due_at))
          .slice(0, 12);
        if (!due.length) break;
        const served = serveItems(due);
        expect(served).toHaveLength(due.length);
        const first = Object.fromEntries(served.map((s) => [s.question.id, rightAnswer(s.question)]));
        await submitReviewCore(db, l, { mode: "daily", answers: gradeReviewAnswers(first, targetsOf(served)), expected: served.length, attemptId: undefined }, now, TODAY);
      }
      for (const { q } of all) {
        const stillDue = Date.parse(db.review("u1", q.id)!.due_at) <= now.getTime();
        dueDays.set(q.id, stillDue ? (dueDays.get(q.id) ?? 0) + 1 : 0);
        maxDueStreak = Math.max(maxDueStreak, dueDays.get(q.id)!);
      }
    }
    expect(maxDueStreak).toBe(0); // at the end of every day, nothing is left due
    // answered right every time, every notion climbed the boxes instead of staying where it was
    for (const { q } of all) expect(db.review("u1", q.id)!.box, q.id).toBeGreaterThanOrEqual(5);
  });
});

describe("regression: retry after a lost response", () => {
  const ATTEMPT = "3f2c1d0e-8a4b-4c6d-9e1f-0a1b2c3d4e5f";
  const quiz = LESSONS[0].questions.filter(isGraded).slice(0, 3);
  // what the session shows for these three notions at box 2 (review forms when the lesson has some), answered right
  const first = Object.fromEntries(serveItems(quiz.map((q) => ({ question_id: q.id, box: 2 }))).map((s) => [s.question.id, rightAnswer(s.question)]));
  const seedDue = () => {
    for (const q of quiz) db.seedReview("u1", { question_id: q.id, lesson_id: LESSONS[0].id, box: 2, lapses: 0, due_at: hours(-1) });
  };
  const servedNow = () => serveItems(quiz.map((q) => db.review("u1", q.id)!).filter((r) => Date.parse(r.due_at) <= NOW.getTime()));

  it("logs a daily session under its own attempt id, and ignores malformed ids", () => {
    expect(dailyRef(ATTEMPT)).toBe(`daily:${ATTEMPT}`);
    expect(dailyRef(ATTEMPT.toUpperCase())).toBe(`daily:${ATTEMPT}`);
    expect(dailyRef(undefined)).toBe("daily");
    expect(dailyRef("checkpoint:b1")).toBe("daily");
    expect(dailyRef({ toString: () => ATTEMPT })).toBe("daily");
  });

  it("a daily session never saved is not 'already saved'", async () => {
    seedDue();
    expect(await savedDailyReview(db, learner(), ATTEMPT, first, TODAY)).toBeNull();
    expect(await savedDailyReview(db, learner(), undefined, first, TODAY)).toBeNull();
  });

  it("the same daily session sent again gets its first result back: same XP, nothing written, nothing paid twice", async () => {
    seedDue();
    const l = learner();
    const served = servedNow();
    const saved = await submitReviewCore(db, l, { mode: "daily", answers: gradeReviewAnswers(first, targetsOf(served)), expected: served.length, attemptId: ATTEMPT }, NOW, TODAY);
    expect(saved).toMatchObject({ correct: 3, total: 3, xpEarned: 6, replay: false });
    const boxes = quiz.map((q) => db.review("u1", q.id)!.box);
    const eventsBefore = db.events.length;

    // the response was lost; the learner presses "Réessayer". The notions are no longer due:
    expect(servedNow()).toHaveLength(0);
    expect(gradeReviewAnswers(first, targetsOf(servedNow()))).toEqual([]); // this is what used to fail forever
    const again = await savedDailyReview(db, l, ATTEMPT, first, TODAY);
    expect(again).toMatchObject({ correct: 3, total: 3, xpEarned: 6, bonus: 0, totalXp: 6, streak: 1, replay: true, passed: true });
    expect(db.events.length).toBe(eventsBefore);
    expect(db.profiles.get("u1")?.xp).toBe(6);
    expect(quiz.map((q) => db.review("u1", q.id)!.box)).toEqual(boxes);
  });

  it("another learner cannot read a result with someone else's attempt id", async () => {
    seedDue();
    const served = servedNow();
    await submitReviewCore(db, learner(), { mode: "daily", answers: gradeReviewAnswers(first, targetsOf(served)), expected: served.length, attemptId: ATTEMPT }, NOW, TODAY);
    expect(await savedDailyReview(db, learner("u2"), ATTEMPT, first, TODAY)).toBeNull();
  });

  it("a daily session whose notions were all taken elsewhere says 'already recorded' instead of failing forever", () => {
    const stale = staleDailyReview(learner("u1", { xp: 40, streakDays: 3, lastActiveDate: TODAY }), first, TODAY);
    expect(stale).toMatchObject({ correct: 3, total: 3, xpEarned: 0, totalXp: 40, streak: 3, replay: true });
    expect(staleDailyReview(learner(), {}, TODAY)).toBeNull(); // an empty or forged submission is still refused upstream
    expect(staleDailyReview(learner(), { nope: "a" }, TODAY)).toBeNull();
  });

  it("a weekly review or a checkpoint sent again is flagged as already counted, not shown as a plain +0 XP", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ target: { questionId: `w${i}`, lessonId: LESSON.id }, ok: true }));
    const once = await submitReviewCore(db, learner(), { mode: "checkpoint:c1", answers: ten, expected: 10 }, NOW, TODAY);
    expect(once.replay).toBe(false);
    const again = await submitReviewCore(db, learner(), { mode: "checkpoint:c1", answers: ten, expected: 10 }, NOW, TODAY);
    expect(again).toMatchObject({ xpEarned: 0, bonus: 0, replay: true, passed: true, correct: 10 });
    expect(db.paidTotal("u1")).toBe(once.xpEarned + once.bonus);
  });

  it("a lesson saved twice in a row is flagged as already counted; a real replay later is not", async () => {
    const l = learner();
    const once = await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY);
    expect(once.replay).toBe(false);
    const again = await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY);
    expect(again).toMatchObject({ xpEarned: 0, replay: true });
    db.clock += 21 * 3_600_000;
    expect((await completeLessonCore(db, l, LESSON, graded(5), NOW, TODAY)).replay).toBe(false);
  });
});

describe("regression: written answers are self-assessed, outside the score and the spaced repetition", () => {
  const written = LESSONS.flatMap((l) => l.questions.map((q) => ({ q, l }))).filter(({ q }) => q.type === "written");

  it("the course has written questions, none of them graded", () => {
    expect(written.length).toBeGreaterThan(0);
    for (const { q } of written) expect(isGraded(q)).toBe(false);
  });

  it("a wrong sentence that contains the right keywords earns nothing: the question is not graded at all", () => {
    const { q, l } = written.find(({ q }) => q.id === "evaluer-un-modele:q8") ?? written[0];
    const target = new Map([[q.id, { questionId: q.id, lessonId: l.id }]]);
    for (const text of ["Cinq exemples suffisent largement, inutile de comparer.", q.type === "written" ? q.modelAnswer : "", ""]) {
      expect(gradeReviewAnswers({ [q.id]: text }, target)).toEqual([]);
    }
  });

  it("written questions are never scheduled, served or put in a chapter review", () => {
    for (const { q, l } of written) {
      expect(serveItems([{ question_id: q.id, box: 1 }]), q.id).toEqual([]);
      expect(checkpointQuestions([l.id], (id) => LESSONS.find((x) => x.id === id)).some((x) => x.type === "written")).toBe(false);
    }
  });

  it("a lesson is scored on its graded questions only", async () => {
    const { l } = written[0];
    const scored = l.questions.filter(isGraded);
    expect(scored.length).toBe(l.questions.length - l.questions.filter((q) => q.type === "written").length);
    const r = await completeLessonCore(db, learner(), { id: l.id, xp: l.xp }, scored.map((q) => ({ questionId: q.id, lessonId: l.id, correct: true })), NOW, TODAY);
    expect(r).toMatchObject({ correct: scored.length, total: scored.length, score: 100, xpEarned: l.xp });
    for (const q of l.questions) expect(Boolean(db.review("u1", q.id)), q.id).toBe(isGraded(q));
  });
});

describe("regression: answers are not always in the same places", () => {
  const withOptions = LESSONS.flatMap((l) => [...l.questions, ...l.reviewQuestions]).filter((q): q is Extract<Question, { type: "mcq" | "fill_choice" | "multi" | "ai_analysis" }> => "options" in q && q.options.length >= 3);

  it("keeps every option, whatever the salt", () => {
    for (const q of withOptions.slice(0, 40)) {
      for (const salt of ["", "a1", "2026-11-10", "2026-11-10|retry"]) expect([...initialOrder(q, salt)].sort()).toEqual(q.options.map((o) => o.id).sort());
    }
  });

  it("is stable for one session (server and browser agree) and without salt keeps the historical order", () => {
    const q = withOptions[0];
    expect(initialOrder(q, "a1")).toEqual(initialOrder(q, "a1"));
    expect(initialOrder(q)).toEqual(initialOrder(q, ""));
  });

  it("changes the order from one attempt or one day to the next for most questions", () => {
    const days = Array.from({ length: 6 }, (_, i) => `2026-11-${10 + i}`);
    const moved = withOptions.filter((q) => new Set(days.map((d) => initialOrder(q, d).join())).size > 1).length;
    expect(moved / withOptions.length).toBeGreaterThan(0.95);
    // and the right answer does not keep one position
    const q = withOptions.find((x) => x.type === "mcq")! as Extract<Question, { type: "mcq" }>;
    expect(new Set(Array.from({ length: 30 }, (_, i) => initialOrder(q, `a${i}`).indexOf(q.answer))).size).toBeGreaterThan(1);
  });
});

describe("the model of award_xp", () => {
  it("rejects out-of-range amounts and windows like the SQL function", async () => {
    const args = { userId: "u1", amount: 10, source: "lesson" as const, ref: "x", streak: 1, today: TODAY, replayHours: 20 };
    await expect(db.awardXp({ ...args, amount: 501 })).rejects.toThrow("amount out of range");
    await expect(db.awardXp({ ...args, amount: -1 })).rejects.toThrow("amount out of range");
    await expect(db.awardXp({ ...args, replayHours: 99999 })).rejects.toThrow("replay window out of range");
  });
});
