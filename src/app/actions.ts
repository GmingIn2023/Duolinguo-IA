"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TRACKS, findChapter, getLesson, isTrackId, lessonPlace } from "@/content";
import type { Answer, TrackId } from "@/content/types";
import { canOpenLesson, lessonKnown } from "@/lib/path";
import { checkpointQuestions, DAILY_LIMIT, getDueItems, getKnowledge, getViewer, getWeeklyPlan, serveItems } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeAnswer } from "@/lib/grading";
import { gradePlacement, legacyLevel } from "@/lib/placement";
import { parsePreferences } from "@/lib/prefs";
import { supabaseProgressDb } from "@/lib/progressDb.supabase";
import { completeLessonCore, gradeReviewAnswers, submitReviewCore, type Learner } from "@/lib/progressService";
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

function syncProfile(viewer: Viewer, learner: Learner) {
  viewer.profile.streak_days = learner.streakDays;
  viewer.profile.last_active_date = learner.lastActiveDate;
  if (learner.xp !== undefined) viewer.profile.xp = learner.xp;
}

function revalidateApp() {
  for (const p of ["/learn", "/map", "/courses", "/review", "/profile"]) revalidatePath(p);
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

  const graded = lesson.questions.map((q) => ({
    questionId: q.id,
    lessonId,
    correct: Object.hasOwn(firstAnswers, q.id) && gradeAnswer(q, firstAnswers[q.id]),
  }));
  const learner = learnerOf(viewer);
  const result = await completeLessonCore(supabaseProgressDb(viewer.supabase), learner, lesson, graded);
  syncProfile(viewer, learner);
  // the lesson is finished: nothing left to resume (a failure here must not hide the result)
  await createAdminClient().from("lesson_resume").delete().eq("user_id", viewer.user.id).eq("lesson_id", lessonId);
  revalidateApp();
  return result;
}

/** The served question ids this learner is allowed to be graded on right now, for the given mode. */
async function allowedQuestions(mode: ReviewMode): Promise<Set<string>> {
  if (typeof mode !== "string") throw new Error("Révision inconnue.");
  if (mode === "daily") return new Set(serveItems((await getDueItems()).slice(0, DAILY_LIMIT)).map((s) => s.question.id));
  if (mode === "weekly") return new Set(serveItems((await getWeeklyPlan()).items).map((s) => s.question.id));
  if (!mode.startsWith("checkpoint:")) throw new Error("Révision inconnue.");
  const found = findChapter(mode.slice("checkpoint:".length));
  if (!found || found.chapter.project) throw new Error("Bilan introuvable.");
  const { knowledge } = await getKnowledge();
  const lessons = found.chapter.lessons;
  if (!lessons.every((id) => lessonKnown(id, found.chapter.id, knowledge))) throw new Error("Ce bilan est encore verrouillé.");
  return new Set(checkpointQuestions(lessons).map((q) => q.id));
}

export async function submitReview(mode: ReviewMode, firstAnswers: Record<string, Answer>): Promise<ReviewResult> {
  if (!isRecord(firstAnswers)) throw new Error("Réponses invalides.");
  const viewer = await viewerOrThrow();
  const allowed = await allowedQuestions(mode);
  const learner = learnerOf(viewer);
  const result = await submitReviewCore(supabaseProgressDb(viewer.supabase), learner, { mode, answers: gradeReviewAnswers(firstAnswers, allowed), expected: allowed.size });
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

/**
 * Stores validated preferences. Unknown values fall back to defaults, so a forged payload cannot store junk,
 * and the placements are copied from the stored row: the browser can never write a test result.
 */
export async function savePreferences(raw: unknown): Promise<void> {
  const { user, profile } = await viewerOrThrow();
  const preferences = { ...parsePreferences(raw), placements: storedPlacements(profile.preferences) };
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
