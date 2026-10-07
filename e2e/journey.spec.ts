import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { finishQuiz, type Memory } from "./helpers";

// Final journey, on a brand-new account created through the real signup:
// onboarding → signup → lesson → quiz → XP saved → daily review → XP still locked against the learner.
// Needs SUPABASE_SECRET_KEY (server-side env) to backdate due reviews and delete the account afterwards.
// Requires "Confirm email" to be off in Supabase Auth.

function env(name: string) {
  if (process.env[name]) return process.env[name];
  try {
    return readFileSync(".env.local", "utf8").match(new RegExp(`^${name}=(.+)$`, "m"))?.[1].trim();
  } catch {
    return undefined;
  }
}
const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
const publishable = (env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ?? env("NEXT_PUBLIC_SUPABASE_ANON_KEY"))!;
const secret = env("SUPABASE_SECRET_KEY");

test.describe.configure({ mode: "serial" });

let api: APIRequestContext;
const created: string[] = [];

test.beforeAll(async ({ playwright }) => {
  api = await playwright.request.newContext({
    // Supabase rejects secret keys sent with a browser User-Agent (Playwright's default)
    userAgent: "gusgus-e2e",
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
    ignoreHTTPSErrors: true,
  });
});

test.afterAll(async () => {
  // the journey's accounts never outlive the run
  for (const id of created) {
    const res = await api.delete(`${url}/auth/v1/admin/users/${id}`, { headers: { apikey: secret!, Authorization: `Bearer ${secret}` } });
    expect(res.ok(), `delete user ${id}: ${res.status()}`).toBeTruthy();
  }
  await api?.dispose();
});

const xpOnScreen = async (page: Page) => Number(await page.getByTitle("points d'expérience").first().locator(".tabular").innerText());

test("new learner: signup → lesson → XP saved → daily review → XP locked", async ({ page }, info) => {
  test.skip(!secret, "SUPABASE_SECRET_KEY not set");
  const email = `journey-${info.project.name}-${Date.now()}@gusgus.test`;
  const password = randomBytes(12).toString("hex");

  // 1. onboarding + real signup
  await page.goto("/onboarding");
  await page.getByRole("radio", { name: /Je veux l'utiliser au travail/ }).click();
  await page.getByRole("radio", { name: "Régulièrement" }).click();
  await page.getByRole("radio", { name: /prédit la suite/ }).click();
  await page.getByRole("radio", { name: /invente une information/ }).click();
  await page.getByRole("button", { name: "Créer mon compte et commencer" }).click();
  await expect(page).toHaveURL(/\/signup/);
  await page.getByLabel("Prénom").fill("Journey");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/learn/, { timeout: 20_000 });

  const auth = await api.post(`${url}/auth/v1/token?grant_type=password`, { headers: { apikey: publishable }, data: { email, password } });
  expect(auth.ok()).toBeTruthy();
  const { access_token: token, user } = await auth.json();
  created.push(user.id);
  expect(await xpOnScreen(page)).toBe(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("L'IA au travail"); // Fox, recommended by onboarding

  // 2. map → lesson → quiz → XP
  await page.getByRole("link", { name: /cours suivant/ }).first().click();
  await page.getByRole("button", { name: "Commencer le cours" }).click();
  await page.getByRole("button", { name: "Passer au quiz" }).click();
  const memory: Memory = new Map(); // corrections seen in the lesson, reused in the review like a real learner
  await finishQuiz(page, /XP gagnés/, memory);
  const earned = Number((await page.getByRole("heading", { name: /XP gagnés/ }).getAttribute("aria-label"))!.match(/\d+/)![0]);
  expect(earned).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Retour au parcours" }).click();
  await expect(page.getByRole("link", { name: /, terminé/ }).first()).toBeVisible();
  expect(await xpOnScreen(page)).toBe(earned);

  // 3. saved: survives sign-out / sign-in
  await page.goto("/profile");
  await page.getByRole("button", { name: /Se déconnecter/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/learn/, { timeout: 20_000 });
  expect(await xpOnScreen(page)).toBe(earned);

  // 4. daily review: make the lesson's questions due now (as if a day had passed)
  const due = await api.patch(`${url}/rest/v1/review_items?user_id=eq.${user.id}`, {
    headers: { apikey: secret!, Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    data: { due_at: new Date(Date.now() - 60_000).toISOString() },
  });
  expect(due.ok(), await due.text()).toBeTruthy();
  await page.goto("/review");
  await page.getByRole("link", { name: "Réviser maintenant" }).click();
  await finishQuiz(page, /XP gagnés/, memory);
  await expect(page.getByText(/reviendront plus tard/)).toBeVisible();
  const reviewEarned = Number((await page.getByRole("heading", { name: /XP gagnés/ }).getAttribute("aria-label"))!.match(/\d+/)![0]);
  expect(reviewEarned).toBeGreaterThan(0);
  await page.goto("/learn");
  const total = await xpOnScreen(page);
  expect(total).toBe(earned + reviewEarned);

  // 5. the learner still cannot change their own XP or streak
  const headers = { apikey: publishable, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  for (const body of [{ xp: total + 1_000_000 }, { streak_days: 365 }, { last_active_date: "2099-01-01" }]) {
    const res = await api.patch(`${url}/rest/v1/profiles?id=eq.${user.id}`, { headers, data: body });
    expect(res.status(), JSON.stringify(body)).toBeGreaterThanOrEqual(401);
    expect((await res.json()).code).toBe("42501");
  }
  const rpc = await api.post(`${url}/rest/v1/rpc/award_xp`, {
    headers,
    data: { p_user: user.id, p_amount: 500, p_source: "lesson", p_ref: "hack", p_streak: 1, p_today: "2099-01-01" },
  });
  expect((await rpc.json()).code).toBe("42501");
  await page.reload();
  expect(await xpOnScreen(page)).toBe(total);
});
