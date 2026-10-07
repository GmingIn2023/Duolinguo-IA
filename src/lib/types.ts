import type { TrackId } from "@/content/types";

export type Profile = {
  id: string;
  display_name: string | null;
  track_id: TrackId | null;
  placement_level: number;
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

export type LessonResult = {
  correct: number;
  total: number;
  score: number;
  xpEarned: number;
  totalXp: number;
  streak: number;
  firstCompletion: boolean;
};

export type ReviewResult = {
  correct: number;
  total: number;
  xpEarned: number;
  weeklyBonus: number;
  totalXp: number;
  streak: number;
};
