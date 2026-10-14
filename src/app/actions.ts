"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findCheckpoint, getLesson, getQuestion, isTrackId } from "@/content";
import type { Answer } from "@/content/types";
import { isKnown, isUnlocked } from "@/lib/board";
import { checkpointQuestions, DAILY_LIMIT, getDueItems, getKnowledge, getViewer, getWeeklyPlan, serveItems } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeAnswer } from "@/lib/grading";
import { gradePlacement, legacyLevel, placementLevel } from "@/lib/placement";
import { parsePreferences } from "@/lib/prefs";
import { nextReviewState } from "@/lib/srs";
import { nextStreak, todayKey } from "@/lib/streak";
import { NOTE_COLORS, NOTE_MAX, type LessonResult, type Note, type NoteColor, type ReviewMode, type ReviewResult } from "@/lib/types";
import { isoWeekKey } from "@/lib/weekly";
import { CHECKPOINT_BONUS_XP, lessonXp, reviewXp, WEEKLY_BONUS_XP } from "@/lib/xp";

type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

async function viewerOrThrow(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Ta session a expiré. Reconnecte-toi pour enregistrer ta progression.");
  return viewer;
}

// Learners can only read their rows (see supabase/migrations): every write below goes through
// the admin client, always scoped to the signed-in user's id.

type Graded = { questionId: string; lessonId: string; correct: boolean };

/** Updates spaced-repetition boxes for the graded notions. */
async function scheduleReviews(viewer: Viewer, graded: Graded[]) {
  if (!graded.length) return;
  const { supabase, user } = viewer;
  const { data: existing, error } = await supabase
    .from("review_items")
    .select("question_id, box, lapses")
    .eq("user_id", user.id)
    .in("question_id", graded.map((g) => g.questionId));
  if (error) throw new Error(error.message);
  const prev = new Map((existing ?? []).map((r) => [r.question_id, { box: r.box, lapses: r.lapses }]));
  const now = new Date();
  const rows = graded.map((g) => {
    const s = nextReviewState(prev.get(g.questionId) ?? null, g.correct, now);
    return {
      user_id: user.id,
      question_id: g.questionId,
      lesson_id: g.lessonId,
      box: s.box,
      lapses: s.lapses,
      due_at: s.dueAt.toISOString(),
      last_reviewed_at: now.toISOString(),
    };
  });
  const { error: upsertError } = await createAdminClient().from("review_items").upsert(rows);
  if (upsertError) throw new Error(upsertError.message);
}

/** Credits XP atomically (event + total + streak). `awarded` is false if this weekly bonus was already paid. */
async function awardXp(viewer: Viewer, amount: number, source: "lesson" | "review" | "weekly", ref: string) {
  const { user, profile } = viewer;
  const today = todayKey();
  const { data, error } = await createAdminClient()
    .rpc("award_xp", {
      p_user: user.id,
      p_amount: amount,
      p_source: source,
      p_ref: ref,
      p_streak: nextStreak(profile.streak_days, profile.last_active_date, today),
      p_today: today,
    })
    .single<{ total_xp: number; streak_days: number; awarded: boolean }>();
  if (error) throw new Error(error.message);
  // keep the cached profile coherent if several awards happen in one request
  if (data.awarded) profile.last_active_date = today;
  profile.xp = data.total_xp;
  profile.streak_days = data.streak_days;
  return { totalXp: data.total_xp, streak: data.streak_days, awarded: data.awarded };
}

function revalidateApp() {
  for (const p of ["/learn", "/map", "/courses", "/review", "/profile"]) revalidatePath(p);
}

export async function completeLesson(lessonId: string, firstAnswers: Record<string, Answer>): Promise<LessonResult> {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error("Cours introuvable.");
  const viewer = await viewerOrThrow();
  const { supabase, user } = viewer;

  // prerequisites are enforced here too, not only in the page that renders the lesson
  const { knowledge } = await getKnowledge();
  if (!isUnlocked(lesson, knowledge, getLesson)) throw new Error("Ce cours est encore verrouillé.");

  const graded = lesson.questions.map((q) => ({
    questionId: q.id,
    lessonId,
    correct: q.id in firstAnswers && gradeAnswer(q, firstAnswers[q.id]),
  }));
  const correct = graded.filter((g) => g.correct).length;
  const total = graded.length;
  const score = Math.round((correct / total) * 100);

  const { data: prev, error } = await supabase
    .from("lesson_progress")
    .select("best_score, attempts, xp_earned, first_completed_at")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const xpEarned = lessonXp({ baseXp: lesson.xp, correct, total, alreadyCompleted: Boolean(prev) });
  const now = new Date().toISOString();
  const { error: upsertError } = await createAdminClient().from("lesson_progress").upsert({
    user_id: user.id,
    lesson_id: lessonId,
    best_score: Math.max(prev?.best_score ?? 0, score),
    attempts: (prev?.attempts ?? 0) + 1,
    xp_earned: (prev?.xp_earned ?? 0) + xpEarned,
    first_completed_at: prev?.first_completed_at ?? now,
    last_completed_at: now,
  });
  if (upsertError) throw new Error(upsertError.message);

  await scheduleReviews(viewer, graded);
  const { totalXp, streak } = await awardXp(viewer, xpEarned, "lesson", lessonId);
  // the lesson is finished: nothing left to resume (a failure here must not hide the result)
  await createAdminClient().from("lesson_resume").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
  revalidateApp();
  return { correct, total, score, xpEarned, totalXp, streak, firstCompletion: !prev };
}

/** The scheduled notion a served question stands for: a review form maps back to the quiz question of the same concept. */
function scheduledFor(servedId: string): { questionId: string; lessonId: string } | null {
  const found = getQuestion(servedId);
  if (!found) return null;
  const { question, lesson, pool } = found;
  if (pool === "quiz") return { questionId: servedId, lessonId: lesson.id };
  const base = question.concept ? lesson.questions.find((q) => q.concept === question.concept) : undefined;
  return { questionId: (base ?? question).id, lessonId: lesson.id };
}

/** The served question ids this learner is allowed to be graded on right now, for the given mode. */
async function allowedQuestions(mode: ReviewMode): Promise<Set<string>> {
  if (mode === "daily") return new Set(serveItems((await getDueItems()).slice(0, DAILY_LIMIT)).map((s) => s.question.id));
  if (mode === "weekly") return new Set(serveItems((await getWeeklyPlan()).items).map((s) => s.question.id));
  const checkpoint = findCheckpoint(mode.slice("checkpoint:".length));
  if (!checkpoint) throw new Error("Bilan introuvable.");
  const { knowledge } = await getKnowledge();
  const covers = checkpoint.node.covers ?? [];
  if (!covers.every((id) => { const l = getLesson(id); return l && isKnown(l, knowledge); })) throw new Error("Ce bilan est encore verrouillé.");
  return new Set(checkpointQuestions(covers).map((q) => q.id));
}

export async function submitReview(mode: ReviewMode, firstAnswers: Record<string, Answer>): Promise<ReviewResult> {
  const viewer = await viewerOrThrow();
  const allowed = await allowedQuestions(mode);
  // one verdict per scheduled notion: missed if any of its forms was missed
  const verdicts = new Map<string, Graded>();
  let correct = 0;
  let total = 0;
  for (const [servedId, answer] of Object.entries(firstAnswers)) {
    const found = getQuestion(servedId);
    const target = scheduledFor(servedId);
    if (!found || !target || !allowed.has(servedId)) continue;
    const ok = gradeAnswer(found.question, answer);
    total += 1;
    if (ok) correct += 1;
    const prev = verdicts.get(target.questionId);
    verdicts.set(target.questionId, { ...target, correct: ok && (prev?.correct ?? true) });
  }
  if (!total) throw new Error("Aucune réponse à enregistrer.");

  await scheduleReviews(viewer, [...verdicts.values()]);
  const xpEarned = reviewXp(correct);
  let bonus = 0;
  let totals: { totalXp: number; streak: number };

  if (mode === "daily") {
    totals = await awardXp(viewer, xpEarned, "review", "daily");
  } else if (mode === "weekly") {
    totals = await awardXp(viewer, xpEarned, "review", "weekly");
    // paid once per ISO week: the database refuses a second claim
    const paid = await awardXp(viewer, WEEKLY_BONUS_XP, "weekly", isoWeekKey(new Date()));
    if (paid.awarded) bonus = WEEKLY_BONUS_XP;
    totals = paid;
  } else {
    const { data: before, error } = await viewer.supabase.from("xp_events").select("id").eq("user_id", viewer.user.id).eq("source", "review").eq("ref", mode).limit(1);
    if (error) throw new Error(error.message);
    if (!before?.length) bonus = CHECKPOINT_BONUS_XP;
    totals = await awardXp(viewer, xpEarned + bonus, "review", mode);
  }
  revalidateApp();
  return { correct, total, xpEarned, bonus, totalXp: totals.totalXp, streak: totals.streak };
}

export async function chooseTrack(formData: FormData) {
  const track = formData.get("track");
  if (!isTrackId(track)) throw new Error("Parcours inconnu.");
  const { supabase, user } = await viewerOrThrow();
  const { error } = await supabase.from("profiles").update({ track_id: track }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/map");
}

/** Stores validated preferences. Unknown values fall back to defaults, so a forged payload cannot store junk. */
export async function savePreferences(raw: unknown): Promise<void> {
  const { user } = await viewerOrThrow();
  const { error } = await createAdminClient().from("profiles").update({ preferences: parsePreferences(raw), updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/** Placement test taken while signed in: answers are re-graded here and the level is computed on the server. */
export async function savePlacement(answers: { id: string; answer: Answer | null }[]): Promise<{ level10: number }> {
  const { user } = await viewerOrThrow();
  if (!Array.isArray(answers)) throw new Error("Test invalide.");
  const level10 = placementLevel(gradePlacement(answers));
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ level10, placement_level: legacyLevel(level10), updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return { level10 };
}

export async function saveResume(lessonId: string, sectionIndex: number): Promise<void> {
  const lesson = getLesson(lessonId);
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
  const { supabase, user } = await viewerOrThrow();
  const body = cleanBody(input.body);
  if (!body) throw new Error("Écris quelque chose avant d'enregistrer.");
  const lesson = input.lessonId ? getLesson(input.lessonId) : undefined;
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
  const { user } = await viewerOrThrow();
  const change: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.body !== undefined) {
    const body = cleanBody(patch.body);
    if (!body) throw new Error("Une note ne peut pas être vide.");
    change.body = body;
  }
  if (isNoteColor(patch.color)) change.color = patch.color;
  if (typeof patch.pinned === "boolean") change.pinned = patch.pinned;
  const { data, error } = await createAdminClient().from("notes").update(change).eq("id", String(id)).eq("user_id", user.id).select(NOTE_COLUMNS).single<Note>();
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { user } = await viewerOrThrow();
  const { error } = await createAdminClient().from("notes").delete().eq("id", String(id)).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}

export async function signOut() {
  const viewer = await getViewer();
  await viewer?.supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
