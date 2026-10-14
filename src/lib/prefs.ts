import { isThemeId } from "@/content/curriculum";
import type { ThemeId } from "@/content/types";

export const SESSION_MINUTES = [3, 5, 10, 15] as const;
export type SessionMinutes = (typeof SESSION_MINUTES)[number];

export type Preferences = {
  /** Guided: one recommended step at a time. Free: every open branch is offered equally. */
  mode: "guided" | "free";
  /** Themes to bring forward, most wanted first. Never overrides prerequisites. */
  themes: ThemeId[];
  /** How long a usual session lasts; drives the suggestions on the home screen. */
  sessionMinutes: SessionMinutes;
  /** Shifts how much the placement level lets the learner skip: -1 gentler, +1 more demanding. */
  pace: -1 | 0 | 1;
};

export const DEFAULT_PREFERENCES: Preferences = { mode: "guided", themes: [], sessionMinutes: 10, pace: 0 };

/** Tolerant parser: anything unknown falls back to the default, so stored rows can never break a page. */
export function parsePreferences(raw: unknown): Preferences {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const themes = Array.isArray(r.themes) ? [...new Set(r.themes.filter(isThemeId))] : [];
  return {
    mode: r.mode === "free" ? "free" : "guided",
    themes,
    sessionMinutes: (SESSION_MINUTES as readonly unknown[]).includes(r.sessionMinutes) ? (r.sessionMinutes as SessionMinutes) : DEFAULT_PREFERENCES.sessionMinutes,
    pace: r.pace === -1 || r.pace === 1 ? r.pace : 0,
  };
}

/** The level used to decide what can be skipped: the estimated level, nudged by the chosen pace. */
export const effectiveLevel = (level10: number, pace: Preferences["pace"]) => Math.min(10, Math.max(0, level10 - pace * 2));

export type DurationBucket = "lt3" | "5" | "10" | "15plus";
export const DURATION_BUCKETS: { id: DurationBucket; label: string; min: number; max: number }[] = [
  { id: "lt3", label: "Moins de 3 min", min: 0, max: 3 },
  { id: "5", label: "Environ 5 min", min: 4, max: 7 },
  { id: "10", label: "Environ 10 min", min: 8, max: 12 },
  { id: "15plus", label: "15 min et plus", min: 13, max: Infinity },
];
export const isDurationBucket = (v: unknown): v is DurationBucket => DURATION_BUCKETS.some((b) => b.id === v);
export const bucketFor = (minutes: number) => DURATION_BUCKETS.find((b) => minutes >= b.min && minutes <= b.max)!;
