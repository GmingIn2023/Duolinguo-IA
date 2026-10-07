import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

// Creates a throwaway confirmed account for the signed-in specs and deletes it when the run ends.
// Starts on the "bird" track so the learner lands on /learn, like a user who finished onboarding.
// Needs SUPABASE_SECRET_KEY; without it, E2E_EMAIL / E2E_PASSWORD are used as provided.

function env(name: string) {
  if (process.env[name]) return process.env[name];
  try {
    return readFileSync(".env.local", "utf8").match(new RegExp(`^${name}=(.+)$`, "m"))?.[1].trim();
  } catch {
    return undefined;
  }
}

export default async function globalSetup() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const secret = env("SUPABASE_SECRET_KEY");
  if (!url || !secret) return;

  const headers = { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": "application/json" };
  const email = `e2e-throwaway-${Date.now()}-${randomBytes(3).toString("hex")}@example.com`;
  const password = `E2e-${randomBytes(18).toString("base64url")}9!`;

  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { purpose: "e2e-throwaway", track_id: "bird" } }),
  });
  if (!res.ok) throw new Error(`Could not create the throwaway E2E account (HTTP ${res.status}).`);
  const { id } = (await res.json()) as { id: string };

  // overrides any real account configured in the environment: the run only ever touches its own user
  process.env.E2E_EMAIL = email;
  process.env.E2E_PASSWORD = password;

  return async () => {
    const del = await fetch(`${url}/auth/v1/admin/users/${id}`, { method: "DELETE", headers });
    if (!del.ok) console.warn(`Throwaway E2E account ${email} was not deleted (HTTP ${del.status}); remove it manually.`);
  };
}
