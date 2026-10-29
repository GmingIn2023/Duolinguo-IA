import { expect, test, type Page } from "@playwright/test";
import { HAS_E2E_USER, login } from "./helpers";
import { answerSectionChecks, finishQuiz } from "./quiz";

// Signed-in loop on an existing confirmed account (E2E_EMAIL / E2E_PASSWORD), e.g. against production:
// home → course (sections, checks, notebook, summary) → quiz with a miss → XP → map → notebook → settings → reviews.
// Runs once (desktop): it changes the account's progress.

const xpOnScreen = async (page: Page) => Number(await page.getByTitle("points d'expérience").first().locator(".tabular").innerText());

test("signed-in learner: course → quiz → XP → map → notebook → settings → reviews", async ({ page }, info) => {
  test.skip(!HAS_E2E_USER, "set E2E_EMAIL and E2E_PASSWORD");
  test.skip(info.project.name !== "desktop", "changes progress: runs once");
  test.setTimeout(240_000);
  await login(page);
  const xpBefore = await xpOnScreen(page);

  // home → next step → course
  await page.locator('[data-step-node][data-status="current"]').click();
  await page.locator("[data-step-card]").getByRole("link", { name: /Commencer|Reprendre/ }).click();
  await expect(page).toHaveURL(/\/lesson\//);
  await page.getByRole("button", { name: /^(Commencer|Revoir le cours)$/ }).click();

  await page.getByRole("button", { name: /Carnet du cours/ }).click();
  await page.getByRole("textbox", { name: "Nouvelle note" }).fill("Note de test E2E");
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText("Note de test E2E")).toBeVisible();
  await page.keyboard.press("Escape");
  for (let s = 0; s < 14; s++) {
    await answerSectionChecks(page);
    const next = page.getByRole("button", { name: /^(Suivant|Fiche à retenir)/ });
    const label = await next.innerText();
    await next.click();
    if (label.includes("Fiche")) break;
  }
  await page.getByRole("button", { name: "Garder dans mon carnet" }).click();
  await expect(page.getByRole("button", { name: "Ajoutée à ton carnet" })).toBeVisible();
  await page.getByRole("button", { name: /Passer au quiz/ }).click();

  await finishQuiz(page, /XP gagnés/, { missOne: true });
  const earned = Number((await page.getByLabel(/XP gagnés/).first().getAttribute("aria-label"))!.match(/\d+/)![0]);
  expect(earned).toBeGreaterThan(0);

  await page.getByRole("link", { name: "Retour au chemin" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-step-node][data-status="completed"]').first()).toBeVisible();
  expect(await xpOnScreen(page)).toBe(xpBefore + earned);

  await page.goto("/courses");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/notes");
  await expect(page.getByText("Note de test E2E").first()).toBeVisible();

  await page.goto("/profile");
  await page.getByRole("radio", { name: "5 min", exact: true }).click();
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio", { name: "5 min", exact: true })).toHaveAttribute("aria-checked", "true");

  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Révision de la semaine" })).toBeVisible();
  await page.getByRole("link", { name: "Lancer", exact: true }).click();
  await finishQuiz(page, /XP gagnés/);
  // a weekly review replayed within 20 h earns nothing more (anti-farming), so only "not less"
  await page.goto("/learn");
  expect(await xpOnScreen(page)).toBeGreaterThanOrEqual(xpBefore + earned);
});

test("signed-in learner: daily review when notions are due", async ({ page }, info) => {
  test.skip(!HAS_E2E_USER, "set E2E_EMAIL and E2E_PASSWORD");
  test.skip(info.project.name !== "desktop", "changes progress: runs once");
  await login(page);
  const before = await xpOnScreen(page);
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Révision du jour" })).toBeVisible();
  const start = page.getByRole("link", { name: "Réviser", exact: true });
  test.skip(!(await start.count()), `nothing due for this account: ${await page.locator("main").innerText()}`);
  await start.click();
  await finishQuiz(page, /XP gagnés/);
  await page.goto("/learn");
  expect(await xpOnScreen(page)).toBeGreaterThan(before);
});
