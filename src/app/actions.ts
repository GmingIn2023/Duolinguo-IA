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
import { REPLAY_WINDOW_HOURS, reviewPassed, srsUpdate } from "@/lib/progressRules";
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
    .select("question_id, box, lapses, due_at")
    .eq("user_id", user.id)
    .in("question_id", graded.map((g) => g.questionId));
  if (error) throw new Error(error.message);
  const prev = new Map((existing ?? []).map((r) => [r.question_id, { box: r.box, lapses: r.lapses, due_at: r.due_at as string | null }]));
  const now = new Date();
  // a right answer on a notion that is not due yet changes nothing (see srsUpdate): replays cannot climb the boxes
  const rows = graded.flatMap((g) => {
    const s = srsUpdate(prev.get(g.questionId) ?? null, g.correct, now);
    if (!s) return [];
    return [
      {
        user_id: user.id,
        question_id: g.questionId,
        lesson_id: g.lessonId,
        box: s.box,
        lapses: s.lapses,
        due_at: s.dueAt.toISOString(),
        last_reviewed_at: now.toISOString(),
      },
    ];
  });
  if (!rows.length) return;
  const { error: upsertError } = await createAdminClient().from("review_items").upsert(rows);
  if (upsertError) throw new Error(upsertError.message);
}

const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Credits XP atomically (event + total + streak). `awarded` is false when a one-off bonus
 * (weekly, checkpoint) was already paid: the database's unique indexes refuse the second claim.
 * With `replayHours`, a claim already paid for the same source and ref inside that window is paid 0:
 * the check and the write happen in one transaction, so two simultaneous requests cannot both be paid.
 * `paid` is the XP really credited.
 */
async function awardXp(viewer: Viewer, amount: number, source: "lesson" | "review" | "weekly" | "checkpoint", ref: string, replayHours = 0) {
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
      p_replay_hours: replayHours,
    })
    .single<{ total_xp: number; streak_days: number; awarded: boolean; paid: number }>();
  if (error) throw new Error(error.message);
  // keep the cached profile coherent if several awards happen in one request
  if (data.awarded) profile.last_active_date = today;
  profile.xp = data.total_xp;
  profile.streak_days = data.streak_days;
  return { totalXp: data.total_xp, streak: data.streak_days, awarded: data.awarded, paid: data.paid };
}

function revalidateApp() {
  for (const p of ["/learn", "/map", "/courses", "/review", "/profile"]) revalidatePath(p);
}

export async function completeLesson(lessonId: string, firstAnswers: Record<string, Answer>): Promise<LessonResult> {
  const lesson = typeof lessonId === "string" ? getLesson(lessonId) : undefined;
  if (!lesson) throw new Error("Cours introuvable.");
  if (!isRecord(firstAnswers)) throw new Error("Réponses invalides.");
  const viewer = await viewerOrThrow();
  const { supabase, user } = viewer;

  // prerequisites are enforced here too, not only in the page that renders the lesson
  const { knowledge } = await getKnowledge();
  if (!isUnlocked(lesson, knowledge, getLesson)) throw new Error("Ce cours est encore verrouillé.");

  const graded = lesson.questions.map((q) => ({
    questionId: q.id,
    lessonId,
    correct: Object.hasOwn(firstAnswers, q.id) && gradeAnswer(q, firstAnswers[q.id]),
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

  // The XP is credited first, and the database decides atomically whether this lesson was already paid inside
  // the replay window: a scripted loop, or two requests sent at once, cannot be paid twice.
  const intended = lessonXp({ baseXp: lesson.xp, correct, total, alreadyCompleted: Boolean(prev) });
  const award = await awardXp(viewer, intended, "lesson", lessonId, REPLAY_WINDOW_HOURS);
  const xpEarned = award.paid;
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
  const { totalXp, streak } = award;
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
  if (typeof mode !== "string") throw new Error("Révision inconnue.");
  if (mode === "daily") return new Set(serveItems((await getDueItems()).slice(0, DAILY_LIMIT)).map((s) => s.question.id));
  if (mode === "weekly") return new Set(serveItems((await getWeeklyPlan()).items).map((s) => s.question.id));
  if (!mode.startsWith("checkpoint:")) throw new Error("Révision inconnue.");
  const checkpoint = findCheckpoint(mode.slice("checkpoint:".length));
  if (!checkpoint) throw new Error("Bilan introuvable.");
  const { knowledge } = await getKnowledge();
  const covers = checkpoint.node.covers ?? [];
  if (!covers.every((id) => { const l = getLesson(id); return l && isKnown(l, knowledge); })) throw new Error("Ce bilan est encore verrouillé.");
  return new Set(checkpointQuestions(covers).map((q) => q.id));
}

export async function submitReview(mode: ReviewMode, firstAnswers: Record<string, Answer>): Promise<ReviewResult> {
  if (!isRecord(firstAnswers)) throw new Error("Réponses invalides.");
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
  // Daily items leave the due list once answered, so they cannot be replayed. The weekly plan and checkpoints can be:
  // their review XP is paid once per window (decided atomically in the database).
  const replayable = mode !== "daily";
  // A checkpoint or a weekly review is "passed" with enough right answers on enough answered questions.
  // Anything less still pays its review XP, but earns neither the passed marker nor the bonus.
  const passed = !replayable || reviewPassed({ correct, answered: total, expected: allowed.size });
  // The "checkpoint:<id>" ref is what marks a checkpoint as passed (see getCheckpointsDone): an unpassed attempt is logged under its own ref.
  const reviewRef = passed ? mode : `try:${mode}`;
  const paidReview = await awardXp(viewer, reviewXp(correct), "review", reviewRef, replayable ? REPLAY_WINDOW_HOURS : 0);
  const xpEarned = paidReview.paid;
  let bonus = 0;
  let totals: { totalXp: number; streak: number } = paidReview;

  if (passed && mode === "weekly") {
    // paid once per ISO week: the database refuses a second claim
    const paid = await awardXp(viewer, WEEKLY_BONUS_XP, "weekly", isoWeekKey(new Date()));
    if (paid.awarded) bonus = WEEKLY_BONUS_XP;
    totals = paid;
  } else if (passed && replayable) {
    // paid once per checkpoint: a unique index makes concurrent submissions unable to claim it twice
    const paid = await awardXp(viewer, CHECKPOINT_BONUS_XP, "checkpoint", mode);
    if (paid.awarded) bonus = CHECKPOINT_BONUS_XP;
    totals = paid;
  }
  revalidateApp();
  return { correct, total, expected: allowed.size, passed, xpEarned, bonus, totalXp: totals.totalXp, streak: totals.streak };
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
  if (!Array.isArray(answers)) throw new Error("Test invalide.");
  const { user } = await viewerOrThrow();
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
