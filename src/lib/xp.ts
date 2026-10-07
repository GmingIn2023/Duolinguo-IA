/** First completion: half the base XP for finishing, the other half scaled by first-try accuracy. Replays earn 20%. */
export function lessonXp(o: { baseXp: number; correct: number; total: number; alreadyCompleted: boolean }): number {
  const accuracy = o.total === 0 ? 1 : o.correct / o.total;
  const full = Math.round(o.baseXp * (0.5 + 0.5 * accuracy));
  return o.alreadyCompleted ? Math.max(1, Math.round(full * 0.2)) : full;
}

export const reviewXp = (correct: number) => correct * 2;

/** One-off bonus for finishing the weekly review. */
export const WEEKLY_BONUS_XP = 30;
