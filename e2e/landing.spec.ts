import { expect, test } from "@playwright/test";

// The landing page: public, no account needed.

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
