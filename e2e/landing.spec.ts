import { expect, test } from "@playwright/test";
import { answerCorrectly } from "./quiz";

// The landing page: public, no account needed.

test.describe("level test inside the landing page", () => {
  test("everything right: 10/10, the stated goal decides the suggested track, answers travel to signup", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("#test");
    await box.getByRole("button", { name: "Commencer le test" }).click();
    await box.getByRole("radio", { name: /Construire avec l'IA/ }).click();
    for (let i = 1; i <= 10; i++) {
      await expect(box.getByText(`Question ${i} sur 10`)).toBeVisible({ timeout: 20_000 });
      await answerCorrectly(box);
      await box.getByRole("button", { name: "Valider" }).click();
    }
    await expect(box.getByText("Ton niveau estimé : 10/10")).toBeAttached();
    const fox = box.getByRole("radio", { name: /Construire/ });
    await expect(fox).toHaveAttribute("aria-checked", "true");
    await expect(fox).toContainText("Conseillé pour toi");
    await box.getByRole("radio", { name: /Pratiquer/ }).click();
    await box.getByRole("button", { name: "Créer mon compte et commencer" }).click();
    await expect(page).toHaveURL(/\/signup\?track=gecko/, { timeout: 30_000 });
    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("gusgus.onboarding") ?? "{}"));
    expect(stored.placement).toHaveLength(10);
    expect(stored.goal).toBe("build");
    expect(stored.track).toBe("gecko");
  });

  test("« Je ne sais pas » everywhere: 0/10 and the beginner track", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("#test");
    await box.getByRole("button", { name: "Commencer le test" }).click();
    await box.getByRole("radio", { name: /Comprendre ce qu'est l'IA/ }).click();
    for (let i = 0; i < 10; i++) await box.getByRole("button", { name: "Je ne sais pas" }).click({ timeout: 20_000 });
    await expect(box.getByText("Ton niveau estimé : 0/10")).toBeAttached();
    await expect(box.getByRole("radio", { name: /Découvrir/ })).toHaveAttribute("aria-checked", "true");
    await box.getByRole("button", { name: "Refaire le test" }).click();
    await expect(box.getByRole("button", { name: "Commencer le test" })).toBeVisible();
  });

  test("choosing a track directly skips the test and still reaches signup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Pratiquer · 21 cours/ }).click();
    const panel = page.getByRole("status").filter({ hasText: "Tu pars sur Pratiquer" });
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Créer mon compte et commencer" }).click();
    await expect(page).toHaveURL(/\/signup\?track=gecko/, { timeout: 30_000 });
    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("gusgus.onboarding") ?? "{}"));
    expect(stored.placement).toEqual([]);
  });
});

test("the three guides are links with a readable name, in track order", async ({ page }) => {
  await page.goto("/");
  const guides = page.getByRole("list", { name: "Les trois parcours" }).getByRole("link");
  await expect(guides).toHaveCount(3);
  await expect(guides.nth(0)).toHaveAccessibleName(/Découvrir/);
  await expect(guides.nth(1)).toHaveAccessibleName(/Pratiquer/);
  await expect(guides.nth(2)).toHaveAccessibleName(/Construire/);
});

test("one speech bubble is visible at a time, and it does not need a hover", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1600); // entrance motion, then the first bubble
  const visible = page.locator('.bubble-say[data-on="true"]');
  await expect(visible).toHaveCount(1);
  await expect(visible).toBeVisible();
});

test("pointing at a guide keeps its bubble and focusing by keyboard works too", async ({ page }) => {
  await page.goto("/");
  const gecko = page.getByRole("list", { name: "Les trois parcours" }).getByRole("link").nth(1);
  await gecko.focus();
  await expect(page.locator('.bubble-say[data-on="true"]')).toContainText("tombe souvent à côté");
});

test("no horizontal scroll and the headline is complete", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const title = page.getByRole("heading", { level: 1 });
  for (const line of ["Apprends l'IA", "comme une", "langue."]) await expect(title).toContainText(line);
});

test("reduced motion: everything is visible at rest and nothing keeps moving", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".landing-scene .guide").first()).toBeVisible();
  const animations = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.getTiming().iterations ?? 1) === Infinity).length);
  expect(animations).toBe(0);
  await context.close();
});
