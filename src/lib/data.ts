import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LessonProgressRow, Profile } from "@/lib/types";
import { isoWeekKey, pickWeeklyReview, WEEKLY_TARGET, type WeeklyCandidate } from "@/lib/weekly";

export const getViewer = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, track_id, placement_level, xp, streak_days, last_active_date")
    .eq("id", auth.user.id)
    .single<Profile>();
  if (error) throw new Error(`Profil introuvable : ${error.message}`);
  return { user: auth.user, profile, supabase };
});

/** For pages behind the proxy: a signed-in viewer is guaranteed. */
export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function getProgress(): Promise<Map<string, LessonProgressRow>> {
  const { supabase, user } = await requireViewer();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, best_score, attempts, xp_earned, first_completed_at, last_completed_at")
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((r) => [r.lesson_id, r as LessonProgressRow]));
}

export async function getDueQuestionIds(limit = 12): Promise<string[]> {
  const { supabase, user } = await requireViewer();
  const { data, error } = await supabase
    .from("review_items")
    .select("question_id")
    .eq("user_id", user.id)
    .lte("due_at", new Date().toISOString())
    .order("due_at")
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.question_id);
}

const weekAgo = () => new Date(Date.now() - 7 * 86_400_000).toISOString();

/** Weekly review: questions from lessons completed in the last 7 days, weakest first. */
export async function getWeeklyPlan() {
  const { supabase, user } = await requireViewer();
  const [{ data: lessons, error: e1 }, { data: bonus, error: e2 }] = await Promise.all([
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).gte("last_completed_at", weekAgo()),
    supabase.from("xp_events").select("id").eq("user_id", user.id).eq("source", "weekly").eq("ref", isoWeekKey(new Date())).limit(1),
  ]);
  if (e1 || e2) throw new Error((e1 ?? e2)!.message);
  const lessonIds = (lessons ?? []).map((l) => l.lesson_id);
  let questionIds: string[] = [];
  if (lessonIds.length) {
    const { data: items, error } = await supabase
      .from("review_items")
      .select("question_id, lesson_id, box, lapses")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds);
    if (error) throw new Error(error.message);
    questionIds = pickWeeklyReview(
      (items ?? []).map((i) => ({ questionId: i.question_id, lessonId: i.lesson_id, box: i.box, lapses: i.lapses }) as WeeklyCandidate),
      WEEKLY_TARGET,
    );
  }
  return { lessonIds, questionIds, bonusClaimed: Boolean(bonus?.length) };
}
