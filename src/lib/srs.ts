/** Leitner boxes: days until the next review once an item reaches a box. */
export const INTERVAL_DAYS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15, 6: 30 };
const MAX_BOX = 6;

export type ReviewState = { box: number; lapses: number };

export function nextReviewState(prev: ReviewState | null, correct: boolean, now: Date) {
  const box = prev === null ? (correct ? 2 : 1) : correct ? Math.min(prev.box + 1, MAX_BOX) : 1;
  const lapses = (prev?.lapses ?? 0) + (correct ? 0 : 1);
  return { box, lapses, dueAt: new Date(now.getTime() + INTERVAL_DAYS[box] * 86_400_000) };
}
