import type { TrackId } from "@/content/types";
import { TRACK_FOR_GOAL, type Goal } from "./goals";

/** The track suggested after the test: the stated goal wins, the level decides only without a goal (same rule as /onboarding). */
export const suggestTrack = (goal: Goal | null, level10: number): TrackId => (goal ? TRACK_FOR_GOAL[goal] : trackForLevel(level10));

/** Same thresholds as /onboarding: below 3 reads as Découvrir, 3 to 5 as Pratiquer, 6 and above as Construire. */
export const trackForLevel = (level10: number): TrackId => (level10 >= 6 ? "fox" : level10 >= 3 ? "gecko" : "bird");

export type GaugeSegment = { index: number; filled: boolean; track: TrackId };

/** Ten segments for a level out of 10; each one carries the colour of the track it belongs to. */
export function gaugeSegments(level10: number): GaugeSegment[] {
  const level = Math.max(0, Math.min(10, Math.round(level10)));
  return Array.from({ length: 10 }, (_, i) => ({ index: i + 1, filled: i < level, track: trackForLevel(i + 1) }));
}
