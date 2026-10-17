import type { TrackId } from "@/content/types";

export type Profile = {
  id: string;
  display_name: string | null;
  track_id: TrackId | null;
  placement_level: number;
  /** Estimated level out of 10; null for accounts created before the placement test existed. */
  level10: number | null;
  preferences: unknown;
  xp: number;
  streak_days: number;
  last_active_date: string | null;
};

export type LessonProgressRow = {
  lesson_id: string;
  best_score: number;
  attempts: number;
  xp_earned: number;
  first_completed_at: string;
  last_completed_at: string;
};

export type ReviewItemRow = { question_id: string; lesson_id: string; box: number; lapses: number; due_at: string };

export const NOTE_COLORS = ["canary", "leaf", "vermilion", "sky", "lilac"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];
export const NOTE_MAX = 2000;

export type Note = {
  id: string;
  lesson_id: string | null;
  section_id: string | null;
  body: string;
  color: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type LessonResult = {
  correct: number;
  total: number;
  score: number;
  xpEarned: number;
  totalXp: number;
  streak: number;
  firstCompletion: boolean;
};

export type ReviewMode = "daily" | "weekly" | `checkpoint:${string}`;

export type ReviewResult = {
  correct: number;
  total: number;
  /** How many questions the session served. */
  expected: number;
  /** Checkpoints and weekly reviews only: false when too few were answered or right (no passed marker, no bonus). Always true for daily reviews. */
  passed: boolean;
  xpEarned: number;
  bonus: number;
  totalXp: number;
  streak: number;
};
