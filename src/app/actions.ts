"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TRACKS, findChapter, getLesson, isTrackId, lessonPlace } from "@/content";
import type { Answer, TrackId } from "@/content/types";
import { canOpenLesson, lessonKnown } from "@/lib/path";
import { checkpointQuestions, DAILY_LIMIT, getDueItems, getKnowledge, getViewer, getWeeklyPlan, serveItems } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeAnswer, isGraded } from "@/lib/grading";
import { gradePlacement, legacyLevel } from "@/lib/placement";
import { parsePreferences } from "@/lib/prefs";
import { supabaseProgressDb } from "@/lib/progressDb.supabase";
import { completeLessonCore, gradeReviewAnswers, savedDailyReview, staleDailyReview, submitReviewCore, type Learner } from "@/lib/progressService";
import { targetsOf, targetsOfQuestions, type Target } from "@/lib/reviewServe";
import { isTimeZone, readTimezone, todayKey } from "@/lib/streak";
import { NOTE_COLORS, NOTE_MAX, type LessonResult, type Note, type NoteColor, type ReviewMode, type ReviewResult } from "@/lib/types";

type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

async function viewerOrThrow(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Ta session a expiré. Reconnecte-toi pour enregistrer ta progression.");
  return viewer;
}

// Learners can only read their rows (see supabase/migrations): every write below goes through
// the admin client, always scoped to the signed-in user's id.

const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The learner as the progress rules see them; `syncProfile` copies the streak and XP back into the cached profile afterwards. */
function learnerOf(viewer: Viewer): Learner {
  const { user, profile } = viewer;
  return { id: user.id, streakDays: profile.streak_days, lastActiveDate: profile.last_active_date, xp: profile.xp };
}

/** Today for this learner: the date in the timezone their browser reported. */
const todayOf = (viewer: Viewer) => todayKey(new Date(), readTimezone(viewer.profile.preferences));

function syncProfile(viewer: Viewer, learner: Learner) {
  viewer.profile.streak_days = learner.streakDays;
  viewer.profile.last_active_date = learner.lastActiveDate;
  if (learner.xp !== undefined) viewer.profile.xp = learner.xp;
}

function revalidateApp() {
  for (const p of ["/learn", "/learn/chapitres", "/courses", "/review", "/profile"]) revalidatePath(p);
}

export async function completeLesson(lessonId: string, firstAnswers: Record<string, Answer>): Promise<LessonResult> {
  const lesson = typeof lessonId === "string" ? getLesson(lessonId) : undefined;
  if (!lesson) throw new Error("Cours introuvable.");
  if (!isRecord(firstAnswers)) throw new Error("Réponses invalides.");
  const viewer = await viewerOrThrow();

  // the path is enforced here too, not only in the page that renders the lesson
  const { knowledge } = await getKnowledge();
  const place = lessonPlace(lesson.id);
  if (!canOpenLesson(lesson.id, viewer.profile.track_id ?? "bird", place ? TRACKS[place.track] : undefined, knowledge, getLesson).ok) throw new Error("Ce cours est encore verrouillé.");

  // written questions are self-assessed: they count neither in the score nor in the spaced repetition (see grading.ts)
  const graded = lesson.questions.filter(isGraded).map((q) => ({
    questionId: q.id,
    lessonId,
    correct: Object.hasOwn(firstAnswers, q.id) && gradeAnswer(q, firstAnswers[q.id]),
  }));
  const learner = learnerOf(viewer);
  const result = await completeLessonCore(supabaseProgressDb(viewer.supabase), learner, lesson, graded, new Date(), todayOf(viewer));
  syncProfile(viewer, learner);
  // the lesson is finished: nothing left to resume (a failure here must not hide the result)
  await createAdminClient().from("lesson_resume").delete().eq("user_id", viewer.user.id).eq("lesson_id", lessonId);
  revalidateApp();
  return result;
}

/**
 * The questions this learner may be graded on right now, for the given mode, each with the scheduled notion it stands for.
 * Built by the same code as the page that served the session, so the two cannot disagree.
 */
async function reviewTargets(mode: ReviewMode): Promise<Map<string, Target>> {
  if (typeof mode !== "string") throw new Error("Révision inconnue.");
  if (mode === "daily") return targetsOf(serveItems((await getDueItems()).slice(0, DAILY_LIMIT)));
  if (mode === "weekly") return targetsOf(serveItems((await getWeeklyPlan()).items));
  if (!mode.startsWith("checkpoint:")) throw new Error("Révision inconnue.");
  const found = findChapter(mode.slice("checkpoint:".length));
  if (!found || found.chapter.project) throw new Error("Bilan introuvable.");
  const { knowledge } = await getKnowledge();
  const lessons = found.chapter.lessons;
  if (!lessons.every((id) => lessonKnown(id, found.chapter.id, knowledge))) throw new Error("Ce bilan est encore verrouillé.");
  return targetsOfQuestions(checkpointQuestions(lessons));
}

/** `attemptId`: drawn once per session by the browser and sent again on a retry, so a session already saved is recognised. */
export async function submitReview(mode: ReviewMode, firstAnswers: Record<string, Answer>, attemptId?: string): Promise<ReviewResult> {
  if (!isRecord(firstAnswers)) throw new Error("Réponses invalides.");
  const viewer = await viewerOrThrow();
  const db = supabaseProgressDb(viewer.supabase);
  const learner = learnerOf(viewer);
  const today = todayOf(viewer);
  if (mode === "daily") {
    // the response of an earlier save got lost and the learner retried: show that result again, write nothing
    const saved = await savedDailyReview(db, learner, attemptId, firstAnswers, today);
    if (saved) return saved;
  }
  const targets = await reviewTargets(mode);
  const answers = gradeReviewAnswers(firstAnswers, targets);
  if (mode === "daily" && !answers.length) {
    const stale = staleDailyReview(learner, firstAnswers, today);
    if (stale) return stale;
  }
  const result = await submitReviewCore(db, learner, { mode, answers, expected: targets.size, attemptId }, new Date(), today);
  syncProfile(viewer, learner);
  revalidateApp();
  return result;
}

export async function chooseTrack(formData: FormData) {
  const track = formData.get("track");
  if (!isTrackId(track)) throw new Error("Parcours inconnu.");
  const { supabase, user } = await viewerOrThrow();
  const { error } = await supabase.from("profiles").update({ track_id: track }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/learn");
}

/** The placements already stored, which preference saves must carry over untouched. */
const storedPlacements = (preferences: unknown) =>
  isRecord(preferences) && isRecord(preferences.placements) ? preferences.placements : {};

/** The stored timezone, carried over the same way (absent until the browser has reported one). */
const storedTimezone = (preferences: unknown) =>
  isRecord(preferences) && isTimeZone(preferences.timezone) ? { timezone: preferences.timezone } : {};

/**
 * Stores validated preferences. Unknown values fall back to defaults, so a forged payload cannot store junk,
 * and the placements are copied from the stored row: the browser can never write a test result.
 */
export async function savePreferences(raw: unknown): Promise<void> {
  const { user, profile } = await viewerOrThrow();
  const preferences = { ...parsePreferences(raw), ...storedTimezone(profile.preferences), placements: storedPlacements(profile.preferences) };
  const { error } = await createAdminClient().from("profiles").update({ preferences, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/**
 * Stores the timezone the browser reports, so "today" (streak, daily goal) is the learner's own day and not the day in Paris.
 * Only a timezone name the server knows is kept; the streak rules never let a change of timezone replay or skip a day
 * (see activityDay in streak.ts).
 */
export async function saveTimezone(timezone: unknown): Promise<void> {
  if (!isTimeZone(timezone)) return;
  const { user, profile } = await viewerOrThrow();
  if (readTimezone(profile.preferences) === timezone && isRecord(profile.preferences) && profile.preferences.timezone === timezone) return;
  const preferences = { ...parsePreferences(profile.preferences), timezone, placements: storedPlacements(profile.preferences) };
  const { error } = await createAdminClient().from("profiles").update({ preferences, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/**
 * A track's placement test taken while signed in: graded here, stored for that track, and the learner moves
 * to that track when `adopt` is set.
 */
export async function savePlacement(track: TrackId, answers: unknown, adopt: boolean): Promise<{ score: number; chapters: string[] }> {
  if (!isTrackId(track) || !Array.isArray(answers)) throw new Error("Test invalide.");
  const { user, profile } = await viewerOrThrow();
  const result = gradePlacement(track, answers);
  const preferences = {
    ...parsePreferences(profile.preferences),
    ...storedTimezone(profile.preferences),
    placements: { ...storedPlacements(profile.preferences), [track]: result },
  };
  const { error } = await createAdminClient()
    .from("profiles")
    .update({
      preferences,
      level10: result.score,
      placement_level: legacyLevel(result.score),
      ...(adopt ? { track_id: track } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return { score: result.score, chapters: result.chapters };
}

export async function saveResume(lessonId: string, sectionIndex: number): Promise<void> {
  const lesson = typeof lessonId === "string" ? getLesson(lessonId) : undefined;
  if (!lesson || !Number.isInteger(sectionIndex) || sectionIndex < 0 || sectionIndex >= lesson.sections.length) return;
  const { user } = await viewerOrThrow();
  const { error } = await createAdminClient()
    .from("lesson_resume")
    .upsert({ user_id: user.id, lesson_id: lessonId, section_index: sectionIndex, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

/* ───────────────────────── Carnet ───────────────────────── */

const NOTE_COLUMNS = "id, lesson_id, section_id, body, color, pinned, created_at, updated_at";
const MAX_NOTES = 300;
const isNoteColor = (v: unknown): v is NoteColor => (NOTE_COLORS as readonly unknown[]).includes(v);
const cleanBody = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, NOTE_MAX) : "");

export async function addNote(input: { body: string; color?: string; lessonId?: string | null; sectionId?: string | null }): Promise<Note> {
  if (!isRecord(input)) throw new Error("Note invalide.");
  const { supabase, user } = await viewerOrThrow();
  const body = cleanBody(input.body);
  if (!body) throw new Error("Écris quelque chose avant d'enregistrer.");
  const lesson = typeof input.lessonId === "string" ? getLesson(input.lessonId) : undefined;
  const section = lesson?.sections.find((s) => s.id === input.sectionId);
  const { count, error: countError } = await supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= MAX_NOTES) throw new Error(`Ton carnet est plein (${MAX_NOTES} notes). Supprime-en quelques-unes.`);
  const { data, error } = await createAdminClient()
    .from("notes")
    .insert({ user_id: user.id, body, color: isNoteColor(input.color) ? input.color : "canary", lesson_id: lesson?.id ?? null, section_id: section?.id ?? null })
    .select(NOTE_COLUMNS)
    .single<Note>();
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  return data;
}

export async function updateNote(id: string, patch: { body?: string; color?: string; pinned?: boolean }): Promise<Note> {
  if (typeof id !== "string" || !UUID.test(id) || !isRecord(patch)) throw new Error("Note introuvable.");
  const { user } = await viewerOrThrow();
  const change: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.body !== undefined) {
    const body = cleanBody(patch.body);
    if (!body) throw new Error("Une note ne peut pas être vide.");
    change.body = body;
  }
  if (isNoteColor(patch.color)) change.color = patch.color;
  if (typeof patch.pinned === "boolean") change.pinned = patch.pinned;
  const { data, error } = await createAdminClient().from("notes").update(change).eq("id", id).eq("user_id", user.id).select(NOTE_COLUMNS).single<Note>();
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  if (typeof id !== "string" || !UUID.test(id)) throw new Error("Note introuvable.");
  const { user } = await viewerOrThrow();
  const { error } = await createAdminClient().from("notes").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}

export async function signOut() {
  const viewer = await getViewer();
  await viewer?.supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
