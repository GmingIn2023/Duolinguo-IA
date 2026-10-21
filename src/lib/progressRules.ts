import { nextReviewState } from "./srs";

/** A replay of the same lesson or session pays XP at most once per this window (anti-farming). The database enforces it. */
export const REPLAY_WINDOW_HOURS = 20;

/** A checkpoint or weekly review counts as passed with at least this share of its questions right… */
export const PASS_RATIO = 0.6;
/** …and at least this share answered at all, so one lucky answer out of ten proves nothing. */
export const MIN_ANSWERED_RATIO = 0.8;

/** Whether a review session earns the "passed" marker and its one-off bonus. `expected` is how many questions were served. */
export function reviewPassed(o: { correct: number; answered: number; expected: number }): boolean {
  if (o.expected <= 0) return false;
  return o.answered >= Math.ceil(o.expected * MIN_ANSWERED_RATIO) && o.correct >= Math.ceil(o.expected * PASS_RATIO);
}

export type StoredReview = { box: number; lapses: number; due_at: string | null };

/**
 * The new spaced-repetition state after an answer, or null to leave the item untouched.
 * - a notion seen for the first time is scheduled normally;
 * - a miss always counts (the learner showed a gap), whenever it happens;
 * - a right answer only moves the notion up when it was actually due: replaying a lesson five times
 *   in a row must not push a notion to the 30-day box on the same day.
 */
export function srsUpdate(prev: StoredReview | null, correct: boolean, now: Date) {
  if (prev === null) return nextReviewState(null, correct, now);
  if (!correct) return nextReviewState({ box: prev.box, lapses: prev.lapses }, false, now);
  const due = prev.due_at === null || new Date(prev.due_at).getTime() <= now.getTime();
  return due ? nextReviewState({ box: prev.box, lapses: prev.lapses }, true, now) : null;
}
