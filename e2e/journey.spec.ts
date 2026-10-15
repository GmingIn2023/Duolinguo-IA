import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { answerSectionChecks, finishQuiz } from "./quiz";

// The real journey of a brand-new learner, on a real account created through the signup form:
// placement test → signup → home → course (sections, in-lesson checks, notebook, summary) → quiz with a miss
// → XP saved → map → notebook → settings → daily review → XP still locked against the learner.
// Needs SUPABASE_SECRET_KEY (to backdate due reviews and delete the account afterwards)
// and "Confirm email" turned off in Supabase Auth (otherwise the signup waits for an email).

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
  for (const id of created) {
    const res = await api.delete(`${url}/auth/v1/admin/users/${id}`, { headers: { apikey: secret!, Authorization: `Bearer ${secret}` } });
    expect(res.ok(), `delete user ${id}: ${res.status()}`).toBeTruthy();
  }
  await api?.dispose();
});

const xpOnScreen = async (page: Page) => Number(await page.getByTitle("points d'expérience").first().locator(".tabular").innerText());
const earnedOnScreen = async (page: Page) => Number((await page.getByRole("heading", { name: /XP gagnés/ }).getAttribute("aria-label"))!.match(/\d+/)![0]);

test("new learner: placement → signup → course → quiz → XP → notes → settings → review", async ({ page }, info) => {
  test.skip(!secret, "SUPABASE_SECRET_KEY not set");
  test.setTimeout(240_000);
  const email = `journey-${info.project.name}-${Date.now()}@gusgus.test`;
  const password = randomBytes(12).toString("hex");

  // 1. placement test (beginner) + real signup
  await page.goto("/onboarding");
  await page.getByRole("radio", { name: /M'en servir pour étudier ou travailler/ }).click();
  await page.getByRole("button", { name: "Commencer le test" }).click();
  for (let i = 0; i < 10; i++) await page.getByRole("button", { name: "Je ne sais pas" }).click();
  await page.getByRole("button", { name: "Créer mon compte et commencer" }).click();
  await expect(page).toHaveURL(/\/signup\?track=gecko/);
  await page.getByLabel("Prénom").fill("Journey");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/learn/, { timeout: 20_000 });

  const auth = await api.post(`${url}/auth/v1/token?grant_type=password`, { headers: { apikey: publishable }, data: { email, password } });
  expect(auth.ok()).toBeTruthy();
  const { access_token: token, user } = await auth.json();
  created.push(user.id);
  const asLearner = { apikey: publishable, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const profile = await (await api.get(`${url}/rest/v1/profiles?id=eq.${user.id}&select=track_id,level10,xp`, { headers: asLearner })).json();
  expect(profile).toEqual([{ track_id: "gecko", level10: 0, xp: 0 }]);

  // 2. home → next step
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Journey");
  expect(await xpOnScreen(page)).toBe(0);
  await page.getByRole("link", { name: /Commencer/ }).first().click();
  await expect(page).toHaveURL(/\/lesson\//);
  await page.getByRole("button", { name: "Commencer", exact: true }).click();

  // 3. sections: in-lesson checks unlock "Suivant"; a note goes into the notebook from the first section
  await page.getByRole("button", { name: /Carnet du cours/ }).click();
  await page.getByRole("textbox", { name: "Nouvelle note" }).fill("Note de test E2E");
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText("Note de test E2E")).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).first().click();
  for (let s = 0; s < 8; s++) {
    await answerSectionChecks(page);
    const next = page.getByRole("button", { name: /^(Suivant|Fiche à retenir)/ });
    const label = await next.innerText();
    await next.click();
    if (label.includes("Fiche")) break;
  }
  await page.getByRole("button", { name: "Garder dans mon carnet" }).click();
  await expect(page.getByRole("button", { name: "Ajoutée à ton carnet" })).toBeVisible();
  await page.getByRole("button", { name: /Passer au quiz/ }).click();

  // 4. quiz with one deliberate miss: it comes back at the end, XP is saved
  await finishQuiz(page, /XP gagnés/, { missOne: true });
  const earned = await earnedOnScreen(page);
  expect(earned).toBeGreaterThan(0);
  await page.getByRole("link", { name: "Voir la carte" }).click();
  await expect(page).toHaveURL(/\/map/);
  await expect(page.getByRole("button", { name: /\. Terminé$/ }).first()).toBeVisible();
  expect(await xpOnScreen(page)).toBe(earned);

  // 5. notebook: the free note and the saved summary
  await page.goto("/notes");
  await expect(page.getByText("Note de test E2E")).toBeVisible();
  await expect(page.locator("article.note")).toHaveCount(2);

  // 6. settings persist
  await page.goto("/profile");
  await page.getByRole("radio", { name: "5 min" }).click();
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio", { name: "5 min" })).toHaveAttribute("aria-checked", "true");

  // 7. daily review: make the lesson's notions due now (as if a day had passed)
  const due = await api.patch(`${url}/rest/v1/review_items?user_id=eq.${user.id}`, {
    headers: { apikey: secret!, Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    data: { due_at: new Date(Date.now() - 60_000).toISOString() },
  });
  expect(due.ok(), await due.text()).toBeTruthy();
  await page.goto("/review");
  await page.getByRole("link", { name: "Réviser maintenant" }).click();
  await finishQuiz(page, /XP gagnés/);
  const reviewEarned = await earnedOnScreen(page);
  expect(reviewEarned).toBeGreaterThan(0);
  await page.goto("/learn");
  const total = await xpOnScreen(page);
  expect(total).toBe(earned + reviewEarned);

  // 8. the learner still cannot write XP, level, preferences, notes or progress directly
  for (const body of [{ xp: total + 1_000_000 }, { streak_days: 365 }, { level10: 10 }, { preferences: { pace: 1 } }]) {
    const res = await api.patch(`${url}/rest/v1/profiles?id=eq.${user.id}`, { headers: asLearner, data: body });
    expect((await res.json()).code, JSON.stringify(body)).toBe("42501");
  }
  for (const [table, body] of [
    ["notes", { user_id: user.id, body: "x" }],
    ["lesson_resume", { user_id: user.id, lesson_id: "x", section_index: 0 }],
    ["xp_events", { user_id: user.id, amount: 500, source: "checkpoint", ref: "checkpoint:x" }],
  ] as const) {
    const res = await api.post(`${url}/rest/v1/${table}`, { headers: asLearner, data: body });
    expect((await res.json()).code, table).toBe("42501");
  }
  await page.reload();
  expect(await xpOnScreen(page)).toBe(total);
});
