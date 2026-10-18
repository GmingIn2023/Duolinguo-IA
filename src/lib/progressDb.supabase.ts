import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AwardResult, LessonProgressRow, ProgressDb, ReviewRow } from "./progressDb";

const UNIQUE_VIOLATION = "23505";

/**
 * The Supabase implementation of ProgressDb. Reads go through the signed-in learner's client (RLS),
 * writes through the admin client, always scoped to the learner's id (learners cannot write these tables).
 */
export function supabaseProgressDb(reader: SupabaseClient): ProgressDb {
  return {
    async getLessonProgress(userId, lessonId) {
      const { data, error } = await reader
        .from("lesson_progress")
        .select("best_score, attempts, xp_earned, first_completed_at")
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .maybeSingle<LessonProgressRow>();
      if (error) throw new Error(error.message);
      return data ?? null;
    },

    async insertLessonProgress(userId, lessonId, row) {
      const { error } = await createAdminClient().from("lesson_progress").insert({ user_id: userId, lesson_id: lessonId, ...row });
      if (!error) return true;
      if (error.code === UNIQUE_VIOLATION) return false;
      throw new Error(error.message);
    },

    async updateLessonProgress(userId, lessonId, expectedAttempts, row) {
      const { data, error } = await createAdminClient().from("lesson_progress")
        .update(row)
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .eq("attempts", expectedAttempts)
        .select("lesson_id");
      if (error) throw new Error(error.message);
      return (data?.length ?? 0) > 0;
    },

    async getReviewItems(userId, questionIds) {
      if (!questionIds.length) return [];
      const { data, error } = await reader.from("review_items").select("question_id, lesson_id, box, lapses, due_at").eq("user_id", userId).in("question_id", questionIds);
      if (error) throw new Error(error.message);
      return (data ?? []) as ReviewRow[];
    },

    async upsertReviewItems(userId, rows) {
      if (!rows.length) return;
      const { error } = await createAdminClient().from("review_items")
        .upsert(rows.map((r) => ({ user_id: userId, ...r })));
      if (error) throw new Error(error.message);
    },

    async claimReviewItem(userId, expected, next) {
      const { data, error } = await createAdminClient().from("review_items")
        .update({ box: next.box, lapses: next.lapses, due_at: next.due_at, last_reviewed_at: next.last_reviewed_at })
        .eq("user_id", userId)
        .eq("question_id", expected.question_id)
        .eq("box", expected.box)
        .lte("due_at", expected.dueBefore)
        .select("question_id");
      if (error) throw new Error(error.message);
      return (data?.length ?? 0) > 0;
    },

    async awardXp(a) {
      const { data, error } = await createAdminClient()
        .rpc("award_xp", {
          p_user: a.userId,
          p_amount: a.amount,
          p_source: a.source,
          p_ref: a.ref,
          p_streak: a.streak,
          p_today: a.today,
          p_replay_hours: a.replayHours,
        })
        .single<{ total_xp: number; streak_days: number; awarded: boolean; paid: number }>();
      if (error) throw new Error(error.message);
      return { totalXp: data.total_xp, streak: data.streak_days, awarded: data.awarded, paid: data.paid } satisfies AwardResult;
    },
  };
}
