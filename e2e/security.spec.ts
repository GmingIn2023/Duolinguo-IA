import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { E2E_USER, HAS_E2E_USER } from "./helpers";

// Attacks the Supabase REST API directly, the way a curious learner would from the browser console.
// Expected: no client can write XP, streak or progress; only the server (secret key) can.

function publicEnv() {
  const env: Record<string, string> = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^(NEXT_PUBLIC_SUPABASE_\w+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {}
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

const { url, key } = publicEnv();

type Res = { status: number; body: { code?: string } & Record<string, unknown> | unknown[] | null };

let api: APIRequestContext;

test.beforeAll(async ({ playwright }) => {
  // outside the browser: same requests a learner could send with curl
  api = await playwright.request.newContext({
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
    ignoreHTTPSErrors: true,
  });
});
test.afterAll(() => api?.dispose());

async function call(path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<Res> {
  const res = await api.fetch(url + path, {
    method: init.method ?? "GET",
    headers: {
      apikey: key!,
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    data: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  return { status: res.status(), body: text ? JSON.parse(text) : null };
}

const denied = (r: Res) => {
  expect([401, 403], JSON.stringify(r.body)).toContain(r.status);
  expect((r.body as { code?: string }).code).toBe("42501");
};

test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== "desktop", "API checks run once");
  test.skip(!url || !key, "Supabase URL / publishable key not configured");
});

test("anonymous visitor cannot write XP or progress", async () => {
  const id = "00000000-0000-0000-0000-000000000000";
  denied(await call(`/rest/v1/profiles?id=eq.${id}`, { method: "PATCH", body: { xp: 999999 } }));
  denied(await call("/rest/v1/xp_events", { method: "POST", body: { user_id: id, amount: 999, source: "lesson" } }));
  denied(await call("/rest/v1/lesson_progress", { method: "POST", body: { user_id: id, lesson_id: "x" } }));
  denied(await call("/rest/v1/rpc/award_xp", { method: "POST", body: { p_user: id, p_amount: 100, p_source: "lesson", p_ref: "x", p_streak: 1, p_today: "2026-01-01" } }));
});

test("signed-in learner cannot give themselves XP", async () => {
  test.skip(!HAS_E2E_USER, "Set E2E_EMAIL / E2E_PASSWORD to run signed-in checks");
  const auth = await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email: E2E_USER.email, password: E2E_USER.password } });
  expect(auth.status, JSON.stringify(auth.body)).toBe(200);
  const { access_token: token, user } = auth.body as { access_token: string; user: { id: string } };
  const me = `/rest/v1/profiles?id=eq.${user.id}`;

  const before = (await call(`${me}&select=xp,streak_days,last_active_date,track_id`, { token })).body as { xp: number; streak_days: number; last_active_date: string | null; track_id: string }[];
  expect(before).toHaveLength(1);

  denied(await call(me, { method: "PATCH", token, body: { xp: before[0].xp + 1_000_000 } }));
  denied(await call(me, { method: "PATCH", token, body: { streak_days: 365 } }));
  denied(await call(me, { method: "PATCH", token, body: { last_active_date: "2099-01-01" } }));
  denied(await call("/rest/v1/xp_events", { method: "POST", token, body: { user_id: user.id, amount: 1000, source: "lesson", ref: "hack" } }));
  denied(await call("/rest/v1/lesson_progress", { method: "POST", token, body: { user_id: user.id, lesson_id: "hack", xp_earned: 1000 } }));
  denied(await call(`/rest/v1/review_items?user_id=eq.${user.id}`, { method: "PATCH", token, body: { box: 6 } }));
  denied(await call("/rest/v1/rpc/award_xp", { method: "POST", token, body: { p_user: user.id, p_amount: 100, p_source: "lesson", p_ref: "hack", p_streak: 1, p_today: "2099-01-01" } }));

  // still allowed: choosing a track (own row only)
  const track = await call(me, { method: "PATCH", token, body: { track_id: before[0].track_id } });
  expect(track.status).toBe(200);
  expect(track.body).toHaveLength(1);

  const after = (await call(`${me}&select=xp,streak_days,last_active_date,track_id`, { token })).body;
  expect(after).toEqual(before);
});
