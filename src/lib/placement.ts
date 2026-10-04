import type { Level, TrackId } from "@/content/types";

export type Situation = "curious" | "student" | "work";
export type Usage = "never" | "sometimes" | "often";

const TRACK_FOR: Record<Situation, TrackId> = { curious: "bird", student: "gecko", work: "fox" };
const USAGE_POINTS: Record<Usage, number> = { never: 0, sometimes: 1, often: 2 };

/** knowledge = number of placement questions answered correctly (0–2). */
export function estimatePlacement(a: { situation: Situation; usage: Usage; knowledge: number }): { track: TrackId; level: Level } {
  const points = a.knowledge + USAGE_POINTS[a.usage];
  const level: Level = points >= 4 ? 3 : points >= 2 ? 2 : 1;
  return { track: TRACK_FOR[a.situation], level };
}
