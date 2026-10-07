const dayDiff = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** Dates are YYYY-MM-DD in the learner's reference timezone. */
export function nextStreak(current: number, lastActive: string | null, today: string): number {
  if (!lastActive) return 1;
  const diff = dayDiff(lastActive, today);
  if (diff === 0) return Math.max(current, 1);
  if (diff === 1) return current + 1;
  return 1;
}

/** Today's date in Europe/Paris as YYYY-MM-DD. */
export const todayKey = (now = new Date()) => now.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
