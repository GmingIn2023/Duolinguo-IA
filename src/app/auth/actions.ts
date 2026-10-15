"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isTrackId } from "@/content";
import { authErrorMessage } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";
import { gradePlacement, isGoal, legacyLevel, placementLevel } from "@/lib/placement";

export type AuthState = { error: string | null; sentTo?: string; values?: { name?: string; email?: string } };


export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Renseigne ton email et ton mot de passe.", values: { email } };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: authErrorMessage(error.message), values: { email } };
  } catch (e) {
    return { error: authErrorMessage(e instanceof Error ? e.message : "network"), values: { email } };
  }
  redirect(safeNext(form.get("next")));
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const values = { name, email };
  if (!name) return { error: "Indique ton prénom : c'est ainsi qu'on t'appellera.", values };
  if (!email) return { error: "Indique ton adresse email.", values };
  if (password.length < 8) return { error: "Mot de passe trop court : 8 caractères minimum.", values };

  const track = form.get("track");
  // the placement answers are re-graded here: a level sent by the browser is never trusted
  let level10: number | null = null;
  let onboarding: Record<string, unknown> = {};
  try {
    const raw = JSON.parse(String(form.get("onboarding") || "{}"));
    if (Array.isArray(raw?.placement)) level10 = placementLevel(gradePlacement(raw.placement));
    if (isGoal(raw?.goal)) onboarding = { goal: raw.goal };
  } catch {}

  const h = await headers();
  // the confirmation link must point back to this site: prefer the configured URL over request
  // headers (Supabase's redirect allow-list is the second guard)
  const origin = process.env.SITE_URL?.replace(/\/$/, "") || (h.get("origin") ?? `https://${h.get("host")}`);
  let hasSession = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/learn`,
        data: { display_name: name, track_id: isTrackId(track) ? track : null, placement_level: legacyLevel(level10 ?? 0), level10, onboarding },
      },
    });
    if (error) return { error: authErrorMessage(error.message), values };
    hasSession = Boolean(data.session);
  } catch (e) {
    return { error: authErrorMessage(e instanceof Error ? e.message : "network"), values };
  }
  if (hasSession) redirect("/learn");
  return { error: null, sentTo: email, values };
}
