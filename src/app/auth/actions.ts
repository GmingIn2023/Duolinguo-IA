"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isTrackId } from "@/content";
import { authErrorMessage } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";

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
  const level = Math.min(3, Math.max(1, Number(form.get("level")) || 1));
  let onboarding = {};
  try {
    onboarding = JSON.parse(String(form.get("onboarding") || "{}"));
  } catch {}

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  let hasSession = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/learn`,
        data: { display_name: name, track_id: isTrackId(track) ? track : null, placement_level: level, onboarding },
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
