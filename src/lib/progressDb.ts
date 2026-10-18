/**
 * What the progress logic needs from the database, as a small interface.
 * The real implementation (progressDb.supabase.ts) talks to Supabase; tests use an in-memory model.
 * Every method marked "atomic" must be a single database operation: that is what the logic relies on.
 */

export type ReviewRow = { question_id: string; lesson_id: string; box: number; lapses: number; due_at: string };
export type ReviewWrite = { question_id: string; lesson_id: string; box: number; lapses: number; due_at: string; last_reviewed_at: string };

export type XpSource = "lesson" | "review" | "weekly" | "checkpoint";
export type AwardArgs = { userId: string; amount: number; source: XpSource; ref: string; streak: number; today: string; replayHours: number };
export type AwardResult = { totalXp: number; streak: number; awarded: boolean; paid: number };

/** Everything one lesson validation writes. The two XP amounts are computed by the server (xp.ts); the database picks one. */
export type CompleteLessonArgs = { userId: string; lessonId: string; xpFirst: number; xpRepeat: number; score: number; streak: number; today: string; replayHours: number };
export type CompleteLessonResult = { totalXp: number; streak: number; awarded: boolean; paid: number; firstCompletion: boolean };

export interface ProgressDb {
  getReviewItems(userId: string, questionIds: string[]): Promise<ReviewRow[]>;
  /** Writes the given absolute states (idempotent: the same input twice gives the same rows). */
  upsertReviewItems(userId: string, rows: ReviewWrite[]): Promise<void>;
  /**
   * Atomic compare-and-swap on one notion: applies only if its box is still the one read AND it is still due
   * (due date at or before `dueBefore`). Once a request has taken a notion, its due date moves forward, so a
   * simultaneous duplicate finds it no longer due. Returns whether it applied.
   */
  claimReviewItem(userId: string, expected: { question_id: string; box: number; dueBefore: string }, next: ReviewWrite): Promise<boolean>;

  /** Atomic (the award_xp database function): event + total + streak, with the replay window decided inside. */
  awardXp(args: AwardArgs): Promise<AwardResult>;
  /**
   * Atomic (the complete_lesson database function): XP event + profile total + streak + lesson_progress row in ONE transaction.
   * Either all of it is written or none of it is (the call throws). Reviews, weekly and checkpoint use awardXp instead.
   */
  completeLesson(args: CompleteLessonArgs): Promise<CompleteLessonResult>;
}
