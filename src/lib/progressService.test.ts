import { beforeEach, describe, expect, it } from "vitest";
import { LESSONS, getQuestion } from "@/content";
import type { Answer, Question } from "@/content/types";
import { completeLessonCore, gradeReviewAnswers, scheduleReviews, submitReviewCore, type GradedAnswer, type Graded, type Learner } from "./progressService";
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
    expect(db.refusedWrites).toBeGreaterThan(0); // the race really happened and was resolved
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

  it("canary: a naive read-then-overwrite implementation DOES lose attempts on this model (so the tests above can fail)", async () => {
    const naive = async (id: string) => {
      const prev = await db.getLessonProgress("u1", id);
      await new Promise<void>((resolve) => setImmediate(resolve)); // the round trip of a separate write
      const next ={ best_score: 100, attempts: (prev?.attempts ?? 0) + 1, xp_earned: (prev?.xp_earned ?? 0) + 10, first_completed_at: NOW.toISOString(), last_completed_at: NOW.toISOString() };
      db.lessonProgress.set(`u1|${id}`, next);
    };
    await Promise.all([naive("x"), naive("x"), naive("x")]);
    expect(db.progress("u1", "x")?.attempts).toBe(1); // three attempts, one recorded
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

  it("grades the first answer of a served question against its scheduled notion", () => {
    const allowed = new Set([quiz.id]);
    expect(gradeReviewAnswers({ [quiz.id]: quiz.answer }, allowed)).toEqual([{ target: { questionId: quiz.id, lessonId: expect.any(String) }, ok: true }]);
    expect(gradeReviewAnswers({ [quiz.id]: wrongOption }, allowed)[0].ok).toBe(false);
  });

  it("ignores questions the learner may not be graded on, and unknown ids", () => {
    expect(gradeReviewAnswers({ [quiz.id]: quiz.answer }, new Set())).toEqual([]);
    expect(gradeReviewAnswers({ "does-not-exist": "a" as Answer }, new Set(["does-not-exist"]))).toEqual([]);
  });

  it("a review form of a concept maps back to the quiz question of the same concept", () => {
    const lesson = LESSONS.find((l) => l.reviewQuestions.some((r) => r.concept && l.questions.some((q) => q.concept === r.concept)))!;
    const form = lesson.reviewQuestions.find((r) => r.concept && lesson.questions.some((q) => q.concept === r.concept))!;
    const base = lesson.questions.find((q) => q.concept === form.concept)!;
    const out = gradeReviewAnswers({ [form.id]: "x" as Answer }, new Set([form.id]));
    expect(out).toHaveLength(1);
    expect(out[0].target).toEqual({ questionId: base.id, lessonId: lesson.id });
    expect(getQuestion(form.id)?.pool).not.toBe("quiz");
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
