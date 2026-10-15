import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { LESSONS, getLesson, getQuestion, reviewVariant } from "@/content";
import type { Question } from "@/content/types";
import type { Knowledge } from "@/lib/board";
import { fromLegacyLevel } from "@/lib/placement";
import { effectiveLevel, parsePreferences } from "@/lib/prefs";
import { createClient } from "@/lib/supabase/server";
import type { LessonProgressRow, Note, Profile, ReviewItemRow } from "@/lib/types";
import { isoWeekKey, pickWeeklyReview, WEEKLY_TARGET, type WeeklyCandidate } from "@/lib/weekly";

export const getViewer = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, track_id, placement_level, level10, preferences, xp, streak_days, last_active_date")
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

/** The learner's level out of 10 (accounts older than the placement test fall back to their 1-3 level). */
export const profileLevel = (profile: Profile) => profile.level10 ?? fromLegacyLevel(profile.placement_level);

export const getProgress = cache(async (): Promise<Map<string, LessonProgressRow>> => {
  const { supabase, user } = await requireViewer();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, best_score, attempts, xp_earned, first_completed_at, last_completed_at")
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  // rows of lessons removed from the curriculum (older versions) are ignored, never rendered
  return new Map((data ?? []).filter((r) => getLesson(r.lesson_id)).map((r) => [r.lesson_id, r as LessonProgressRow]));
});

export const getReviewItems = cache(async (): Promise<ReviewItemRow[]> => {
  const { supabase, user } = await requireViewer();
  const { data, error } = await supabase
    .from("review_items")
    .select("question_id, lesson_id, box, lapses, due_at")
    .eq("user_id", user.id)
    .order("due_at");
  if (error) throw new Error(error.message);
  // notions whose question no longer exists (older curriculum) can never be served: dropping them
  // keeps them from filling the daily slots and the "due" badge forever
  return ((data ?? []) as ReviewItemRow[]).filter((i) => getQuestion(i.question_id));
});

/** Checkpoints already passed, read from the XP ledger. */
export const getCheckpointsDone = cache(async (): Promise<Set<string>> => {
  const { supabase, user } = await requireViewer();
  const { data, error } = await supabase.from("xp_events").select("ref").eq("user_id", user.id).eq("source", "review").like("ref", "checkpoint:%");
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => String(r.ref).slice("checkpoint:".length)));
});

/** Everything the board, the catalogue and the lesson gate need to decide what is open. */
export const getKnowledge = cache(async () => {
  const { profile } = await requireViewer();
  const [progress, checkpoints] = await Promise.all([getProgress(), getCheckpointsDone()]);
  const prefs = parsePreferences(profile.preferences);
  const level10 = profileLevel(profile);
  const knowledge: Knowledge = { completed: new Set(progress.keys()), level10: effectiveLevel(level10, prefs.pace), checkpoints };
  return { knowledge, prefs, progress, level10 };
});

export type Served = { scheduledId: string; question: Question };

/** Turns scheduled items into the questions to show, a notion coming back under another form when one exists. */
export function serveItems(items: Pick<ReviewItemRow, "question_id" | "box">[]): Served[] {
  const seen = new Set<string>();
  return items.flatMap((i) => {
    const question = reviewVariant(i.question_id, i.box);
    if (!question || seen.has(question.id)) return [];
    seen.add(question.id);
    return [{ scheduledId: i.question_id, question }];
  });
}

export const DAILY_LIMIT = 12;

export async function getDueItems(): Promise<ReviewItemRow[]> {
  const now = Date.now();
  return (await getReviewItems()).filter((i) => Date.parse(i.due_at) <= now);
}

const weekAgo = () => Date.now() - 7 * 86_400_000;

/** Weekly review: notions from lessons completed in the last 7 days, weakest first. */
export const getWeeklyPlan = cache(async () => {
  const { supabase, user } = await requireViewer();
  const [progress, items, { data: bonus, error }] = await Promise.all([
    getProgress(),
    getReviewItems(),
    supabase.from("xp_events").select("id").eq("user_id", user.id).eq("source", "weekly").eq("ref", isoWeekKey(new Date())).limit(1),
  ]);
  if (error) throw new Error(error.message);
  const since = weekAgo();
  const lessonIds = [...progress.values()].filter((p) => Date.parse(p.last_completed_at) >= since).map((p) => p.lesson_id);
  const recent = new Set(lessonIds);
  const inWeek = items.filter((i) => recent.has(i.lesson_id));
  const picked = pickWeeklyReview(
    inWeek.map((i) => ({ questionId: i.question_id, lessonId: i.lesson_id, box: i.box, lapses: i.lapses }) as WeeklyCandidate),
    WEEKLY_TARGET,
  );
  const byId = new Map(inWeek.map((i) => [i.question_id, i]));
  return { lessonIds, items: picked.map((id) => byId.get(id)!), bonusClaimed: Boolean(bonus?.length) };
});

/** A checkpoint's questions: two per covered lesson, review forms first so notions come back differently. */
export function checkpointQuestions(covers: string[]): Question[] {
  return covers.flatMap((id) => {
    const l = getLesson(id);
    return l ? [...l.reviewQuestions, ...l.questions].slice(0, 2) : [];
  });
}

export async function getNotes(lessonId?: string): Promise<Note[]> {
  const { supabase, user } = await requireViewer();
  let query = supabase
    .from("notes")
    .select("id, lesson_id, section_id, body, color, pinned, created_at, updated_at")
    .eq("user_id", user.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(300);
  if (lessonId) query = query.eq("lesson_id", lessonId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Note[];
}

/** Lessons left unfinished, with the section to resume at. */
export const getResume = cache(async (): Promise<Map<string, number>> => {
  const { supabase, user } = await requireViewer();
  const { data, error } = await supabase.from("lesson_resume").select("lesson_id, section_index, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((r) => [r.lesson_id, r.section_index]));
});

export const ALL_LESSONS = LESSONS;
