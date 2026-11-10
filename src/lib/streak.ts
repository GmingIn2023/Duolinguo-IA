const dayDiff = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** Used until the browser has reported the learner's timezone. */
export const DEFAULT_TIMEZONE = "Europe/Paris";

/** Whether `v` is a timezone name this runtime knows (IANA, e.g. "America/Toronto"). */
export function isTimeZone(v: unknown): v is string {
  if (typeof v !== "string" || !v || v.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return true;
  } catch {
    return false;
  }
}

/** The learner's timezone, stored in `preferences.timezone` by the browser; Europe/Paris when unknown or invalid. */
export function readTimezone(preferences: unknown): string {
  const tz = preferences && typeof preferences === "object" ? (preferences as Record<string, unknown>).timezone : null;
  return isTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
}

/** The date as YYYY-MM-DD in the given timezone. */
export const todayKey = (now = new Date(), timeZone = DEFAULT_TIMEZONE) => now.toLocaleDateString("sv-SE", { timeZone });

/**
 * The day an activity counts for. It never goes back before the last active day: a learner who travels west
 * (or changes timezone) keeps their day instead of replaying yesterday, which would reset or inflate the streak.
 */
export const activityDay = (today: string, lastActive: string | null) => (lastActive && lastActive > today ? lastActive : today);

/** Dates are YYYY-MM-DD in the learner's timezone. */
export function nextStreak(current: number, lastActive: string | null, today: string): number {
  if (!lastActive) return 1;
  const diff = dayDiff(lastActive, today);
  if (diff <= 0) return Math.max(current, 1);
  if (diff === 1) return current + 1;
  return 1;
}

/**
 * The streak to SHOW. The stored value is only rewritten at the next activity, so after a missed day it is
 * stale: a streak is alive when the last activity was today or yesterday, and 0 otherwise.
 */
export function displayStreak(current: number, lastActive: string | null, today: string): number {
  if (!lastActive || current <= 0) return 0;
  return dayDiff(lastActive, today) <= 1 ? current : 0;
}

/** The streak to show for a profile row, today in the learner's own timezone. */
export function profileStreak(p: { streak_days: number; last_active_date: string | null; preferences: unknown }, now = new Date()): number {
  return displayStreak(p.streak_days, p.last_active_date, todayKey(now, readTimezone(p.preferences)));
}
