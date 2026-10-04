"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLesson, getQuestion, isTrackId } from "@/content";
import type { Answer } from "@/content/types";
import { getViewer } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { gradeAnswer } from "@/lib/grading";
import { nextReviewState } from "@/lib/srs";
import { nextStreak, todayKey } from "@/lib/streak";
import type { LessonResult, ReviewResult } from "@/lib/types";
import { isoWeekKey } from "@/lib/weekly";
import { lessonXp, reviewXp, WEEKLY_BONUS_XP } from "@/lib/xp";

type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

async function viewerOrThrow(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Ta session a expiré. Reconnecte-toi pour enregistrer ta progression.");
  return viewer;
}

// Learners can only read their progress (see supabase/migrations/*_lock_progress_writes.sql):
// every write below goes through the admin client, always scoped to the signed-in user's id.

/** Updates spaced-repetition boxes for the graded questions. */
async function scheduleReviews(viewer: Viewer, graded: { questionId: string; lessonId: string; correct: boolean }[]) {
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

export async function completeLesson(lessonId: string, firstAnswers: Record<string, Answer>): Promise<LessonResult> {
  const lesson = getLesson(lessonId);
  if (!lesson) throw new Error("Cours introuvable.");
  const viewer = await viewerOrThrow();
  const { supabase, user } = viewer;

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
  revalidatePath("/learn");
  return { correct, total, score, xpEarned, totalXp, streak, firstCompletion: !prev };
}

export async function submitReview(mode: "daily" | "weekly", firstAnswers: Record<string, Answer>): Promise<ReviewResult> {
  const viewer = await viewerOrThrow();
  const graded = Object.entries(firstAnswers).flatMap(([questionId, answer]) => {
    const found = getQuestion(questionId);
    return found ? [{ questionId, lessonId: found.lesson.id, correct: gradeAnswer(found.question, answer) }] : [];
  });
  if (!graded.length) throw new Error("Aucune réponse à enregistrer.");
  const correct = graded.filter((g) => g.correct).length;

  await scheduleReviews(viewer, graded);
  const xpEarned = reviewXp(correct);
  let { totalXp, streak } = await awardXp(viewer, xpEarned, "review", mode);

  let weeklyBonus = 0;
  if (mode === "weekly") {
    // paid once per ISO week: the database refuses a second claim
    const bonus = await awardXp(viewer, WEEKLY_BONUS_XP, "weekly", isoWeekKey(new Date()));
    if (bonus.awarded) weeklyBonus = WEEKLY_BONUS_XP;
    ({ totalXp, streak } = bonus);
  }
  revalidatePath("/learn");
  revalidatePath("/review");
  return { correct, total: graded.length, xpEarned, weeklyBonus, totalXp, streak };
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

export async function signOut() {
  const viewer = await getViewer();
  await viewer?.supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
