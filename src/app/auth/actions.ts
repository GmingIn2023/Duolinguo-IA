"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isTrackId } from "@/content";
import { authErrorMessage } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";
import { clientIp, limitFactor, rateLimit, rateLimitStatus, recordFailure, throttleMessage } from "@/lib/rateLimit";
import { gradePlacement, isGoal, legacyLevel } from "@/lib/placement";

export type AuthState = { error: string | null; sentTo?: string; values?: { name?: string; email?: string } };


export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Renseigne ton email et ton mot de passe.", values: { email } };
  const h = await headers();
  // A shared address (school, office, household) must not be locked out by people who simply log in:
  // only a wrong password counts against the window.
  const failureKey = `login:${clientIp(h)}`;
  const gate = rateLimitStatus(failureKey, 10 * limitFactor());
  if (!gate.ok) return { error: throttleMessage(gate.retryAfterSeconds, "login"), values: { email } };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      recordFailure(failureKey, 10 * 60_000);
      return { error: authErrorMessage(error.message), values: { email } };
    }
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

  const h = await headers();
  const gate = rateLimit(`signup:${clientIp(h)}`, 5 * limitFactor(), 60 * 60_000);
  if (!gate.ok) return { error: throttleMessage(gate.retryAfterSeconds, "signup"), values };

  const track = form.get("track");
  // the placement answers are re-graded here, for the track they were a test of: a score sent by the browser is never trusted
  let level10: number | null = null;
  const onboarding: Record<string, unknown> = {};
  try {
    const raw = JSON.parse(String(form.get("onboarding") || "{}"));
    if (isGoal(raw?.goal)) onboarding.goal = raw.goal;
    if (isTrackId(raw?.tested) && Array.isArray(raw?.placement) && raw.placement.length) {
      const result = gradePlacement(raw.tested, raw.placement);
      level10 = result.score;
      onboarding.placement = { track: raw.tested, ...result };
    }
  } catch {}

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
        emailRedirectTo: `${origin}/auth/confirm?next=/learn`,
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

/** Always answers the same thing, whether or not the address has an account. */
export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Indique l'adresse email de ton compte.", values: { email } };

  const h = await headers();
  const gate = rateLimit(`forgot:${clientIp(h)}`, 5 * limitFactor(), 15 * 60_000);
  if (!gate.ok) return { error: throttleMessage(gate.retryAfterSeconds, "forgot"), values: { email } };
  const origin = process.env.SITE_URL?.replace(/\/$/, "") || (h.get("origin") ?? `https://${h.get("host")}`);
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=/login/reset`,
    });
    if (error) return { error: authErrorMessage(error.message), values: { email } };
  } catch (e) {
    return { error: authErrorMessage(e instanceof Error ? e.message : "network"), values: { email } };
  }
  return { error: null, sentTo: email, values: { email } };
}

/** Reached from the recovery link: /auth/confirm verified the token and opened a short-lived session. */
export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "Mot de passe trop court : 8 caractères minimum." };
  if (password !== confirm) return { error: "Les deux mots de passe ne sont pas identiques." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: authErrorMessage(error.message) };
  } catch (e) {
    return { error: authErrorMessage(e instanceof Error ? e.message : "network") };
  }
  redirect("/learn");
}
