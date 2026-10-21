import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AwardResult, CompleteLessonResult, ProgressDb, ReviewRow } from "./progressDb";

/**
 * The Supabase implementation of ProgressDb. Reads go through the signed-in learner's client (RLS),
 * writes through the admin client, always scoped to the learner's id (learners cannot write these tables).
 */
export function supabaseProgressDb(reader: SupabaseClient): ProgressDb {
  return {
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

    async completeLesson(a) {
      const { data, error } = await createAdminClient()
        .rpc("complete_lesson", {
          p_user: a.userId,
          p_lesson: a.lessonId,
          p_xp_first: a.xpFirst,
          p_xp_repeat: a.xpRepeat,
          p_score: a.score,
          p_streak: a.streak,
          p_today: a.today,
          p_replay_hours: a.replayHours,
        })
        .single<{ total_xp: number; streak_days: number; awarded: boolean; paid: number; first_completion: boolean }>();
      if (error) throw new Error(error.message);
      return { totalXp: data.total_xp, streak: data.streak_days, awarded: data.awarded, paid: data.paid, firstCompletion: data.first_completion } satisfies CompleteLessonResult;
    },
  };
}
