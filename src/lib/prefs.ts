import { TRACKS, isTrackId } from "@/content/curriculum";
import type { TrackId } from "@/content/types";
import type { Placement, Placements } from "./path";

export const SESSION_MINUTES = [3, 5, 10, 15] as const;
export type SessionMinutes = (typeof SESSION_MINUTES)[number];
export const DAILY_GOALS = [10, 20, 30, 50] as const;
export type DailyGoal = (typeof DAILY_GOALS)[number];

export type Preferences = {
  /** Guided: the path opens one lesson at a time. Free: every lesson of the track is open. */
  mode: "guided" | "free";
  /** How long a usual session lasts; drives the suggestions. */
  sessionMinutes: SessionMinutes;
  /** XP to earn each day; shown as a ring on the home screen. */
  dailyGoal: DailyGoal;
  /** Short sounds on right and wrong answers. */
  sounds: boolean;
  /** "calm" keeps the mascot still (it still changes expression). */
  motion: "full" | "calm";
  /** Larger reading text in lessons. */
  textSize: "normal" | "large";
};

export const DEFAULT_PREFERENCES: Preferences = { mode: "guided", sessionMinutes: 5, dailyGoal: 20, sounds: true, motion: "full", textSize: "normal" };

const pick = <T,>(allowed: readonly T[], v: unknown, fallback: T): T => ((allowed as readonly unknown[]).includes(v) ? (v as T) : fallback);

/** Tolerant parser: anything unknown falls back to the default, so stored rows can never break a page. */
export function parsePreferences(raw: unknown): Preferences {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    mode: r.mode === "free" ? "free" : "guided",
    sessionMinutes: pick(SESSION_MINUTES, r.sessionMinutes, DEFAULT_PREFERENCES.sessionMinutes),
    dailyGoal: pick(DAILY_GOALS, r.dailyGoal, DEFAULT_PREFERENCES.dailyGoal),
    sounds: typeof r.sounds === "boolean" ? r.sounds : DEFAULT_PREFERENCES.sounds,
    motion: r.motion === "calm" ? "calm" : "full",
    textSize: r.textSize === "large" ? "large" : "normal",
  };
}

/** One stored placement, or null when malformed. Chapters must belong to the track and be testable. */
export function parsePlacement(track: TrackId, raw: unknown): Placement | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const score = typeof r.score === "number" && Number.isInteger(r.score) ? Math.min(10, Math.max(0, r.score)) : null;
  if (score === null) return null;
  const allowed = TRACKS[track].chapters.filter((c) => !c.project).map((c) => c.id);
  const chapters = Array.isArray(r.chapters) ? allowed.filter((c) => (r.chapters as unknown[]).includes(c)) : [];
  const at = typeof r.at === "string" && !Number.isNaN(Date.parse(r.at)) ? r.at : new Date(0).toISOString();
  return { score, chapters, at };
}

/**
 * The placements of a learner. The signup copies the first test into `onboarding.placement` (with its
 * track); later tests are written by the server into `preferences.placements`, which wins.
 */
export function readPlacements(onboarding: unknown, preferences: unknown): Placements {
  const out: Placements = {};
  const first = (onboarding && typeof onboarding === "object" ? (onboarding as Record<string, unknown>).placement : null) as Record<string, unknown> | null;
  if (first && isTrackId(first.track)) {
    const p = parsePlacement(first.track, first);
    if (p) out[first.track] = p;
  }
  const stored = (preferences && typeof preferences === "object" ? (preferences as Record<string, unknown>).placements : null) as Record<string, unknown> | null;
  if (stored && typeof stored === "object") {
    for (const [track, value] of Object.entries(stored)) {
      if (!isTrackId(track)) continue;
      const p = parsePlacement(track, value);
      if (p) out[track] = p;
    }
  }
  return out;
}
