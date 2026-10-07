export type WeeklyCandidate = { questionId: string; lessonId: string; box: number; lapses: number };

/** ~45s per question → 12 questions ≈ 10 minutes. */
export const WEEKLY_TARGET = 12;

const weakness = (a: WeeklyCandidate, b: WeeklyCandidate) => b.lapses - a.lapses || a.box - b.box;

/** Weakest items first, interleaved across lessons so one lesson can't fill the session. */
export function pickWeeklyReview(items: WeeklyCandidate[], target = WEEKLY_TARGET): string[] {
  const byLesson = new Map<string, WeeklyCandidate[]>();
  for (const item of [...items].sort(weakness)) {
    byLesson.set(item.lessonId, [...(byLesson.get(item.lessonId) ?? []), item]);
  }
  const queues = [...byLesson.values()];
  const picked: string[] = [];
  while (picked.length < target && queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next && picked.length < target) picked.push(next.questionId);
    }
  }
  return picked;
}

export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
