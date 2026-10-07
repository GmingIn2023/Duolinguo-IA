import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client with the project's secret key (service_role): bypasses RLS.
 * The only way to write XP, streak, lesson progress and review state — learners have read access only.
 * Every query made with it must filter on the signed-in user's id.
 */
export function createAdminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    console.error("SUPABASE_SECRET_KEY is not set: progress cannot be saved.");
    throw new Error("L'enregistrement de la progression est indisponible pour le moment.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
