import { expect, test } from "@playwright/test";
import { answerCorrectly } from "./quiz";

// Public flows: no account needed.

test("landing: thesis and the three guides lead into the level test", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Apprends l'IA");
  const guides = page.getByRole("list", { name: "Les trois parcours" }).getByRole("listitem");
  await expect(guides).toHaveCount(3);
  await guides.first().getByRole("link").click();
  await expect(page).toHaveURL(/#depart$/);
  await expect(page.getByRole("button", { name: "Commencer le test" })).toBeVisible();
});

test("placement test adapts, scores 10/10 when everything is right, and leads to signup", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("radio", { name: /Construire avec l'IA/ }).click();
  await page.getByRole("button", { name: "Commencer le test" }).click();
  const main = page.locator("main");
  for (let i = 1; i <= 10; i++) {
    await expect(page.getByText(`${i}/10`, { exact: true })).toBeVisible();
    await answerCorrectly(main);
    await page.getByRole("button", { name: "Valider" }).click();
  }
  await expect(page.getByText("Ton niveau estimé", { exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { level: 1 })).toContainText("10");
  const fox = page.getByRole("radio", { name: /Construire/ });
  await expect(fox).toHaveAttribute("aria-checked", "true");
  await expect(fox).toContainText("Conseillé pour toi");
  await page.getByRole("radio", { name: /Pratiquer/ }).click();
  await page.getByRole("button", { name: "Créer mon compte et commencer" }).click();
  await expect(page).toHaveURL(/\/signup\?track=gecko/);
  await expect(page.getByText("Parcours choisi")).toContainText("Pratiquer");
  // the answers travel with the form and are graded again on the server
  const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("gusgus.onboarding") ?? "{}"));
  expect(stored.placement).toHaveLength(10);
  await page.getByLabel("Prénom").fill("Test");
  await page.getByLabel("Email").fill("someone@gusgus.test");
  await page.getByLabel("Mot de passe").fill("short");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "8 caractères" })).toBeVisible();
});

test("« Je ne sais pas » everywhere gives 0/10 and the beginner map", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("radio", { name: /Comprendre ce qu'est l'IA/ }).click();
  await page.getByRole("button", { name: "Commencer le test" }).click();
  for (let i = 0; i < 10; i++) await page.getByRole("button", { name: "Je ne sais pas" }).click();
  await expect(page.getByText("Ton niveau estimé", { exact: true })).toBeVisible();
  await expect(page.locator("main").getByRole("heading", { level: 1 })).toContainText("0");
  await expect(page.getByRole("radio", { name: /Découvrir/ })).toHaveAttribute("aria-checked", "true");
});

test("protected pages redirect to login; bad credentials show a clear error", async ({ page }) => {
  for (const path of ["/learn", "/map", "/courses", "/review", "/notes", "/profile", "/lesson/premier-prompt"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL((url) => url.pathname === "/login" && url.searchParams.get("next") === path);
  }
  await page.getByLabel("Email").fill("nobody@gusgus.test");
  await page.getByLabel("Mot de passe").fill("wrong-password");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Email ou mot de passe incorrect" })).toBeVisible();
});

test("unknown pages answer 404; the dev preview is not exposed in production", async ({ page }) => {
  const res = await page.goto("/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  if (process.env.E2E_PRODUCTION) {
    const preview = await page.goto("/dev/preview?view=gallery");
    expect(preview?.status()).toBe(404);
  }
});
