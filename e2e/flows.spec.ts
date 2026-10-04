import { expect, test } from "@playwright/test";
import { finishQuiz, login } from "./helpers";

test("landing: thesis, tracks and a playable question", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Apprends l'IA");
  await expect(page.getByRole("list", { name: "Les trois parcours" }).getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Faux" }).click();
  await expect(page.getByText("Juste !")).toBeVisible();
});

test("onboarding estimates a level, proposes a track, and lets you change it", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("radio", { name: /Je veux l'utiliser au travail/ }).click();
  await page.getByRole("radio", { name: "Régulièrement" }).click();
  await page.getByRole("radio", { name: /prédit la suite/ }).click();
  await page.getByRole("radio", { name: /invente une information/ }).click();
  await expect(page.getByText("Ton niveau estimé : Déjà à l'aise")).toBeVisible();
  await expect(page.getByRole("radio", { name: /Fox.*Recommandé/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: /Gecko/ }).click();
  await expect(page.getByRole("radio", { name: /Gecko/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Créer mon compte et commencer" }).click();
  await expect(page).toHaveURL(/\/signup\?track=gecko&level=3/);
  await expect(page.getByText("Parcours choisi")).toContainText("Gecko");
  // client-side validation, without sending a real email
  await page.getByLabel("Prénom").fill("Test");
  await page.getByLabel("Email").fill("someone@gusgus.test");
  await page.getByLabel("Mot de passe").fill("short");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "8 caractères" })).toBeVisible();
});

test("protected pages redirect to login; bad credentials show a clear error", async ({ page }) => {
  await page.goto("/learn");
  await expect(page).toHaveURL(/\/login\?next=%2Flearn/);
  await page.getByLabel("Email").fill("nobody@gusgus.test");
  await page.getByLabel("Mot de passe").fill("wrong-password");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Email ou mot de passe incorrect" })).toBeVisible();
});

test("core loop: map → lesson → quiz with corrections → XP saved → weekly review", async ({ page }) => {
  await login(page);
  const xpBefore = Number(await page.getByTitle("points d'expérience").first().locator(".tabular").innerText());

  // open the current lesson from the map
  await page.getByRole("link", { name: /cours suivant/ }).first().click();
  await expect(page.getByRole("heading", { name: "Compétences" })).toBeVisible();
  await page.getByRole("button", { name: "Commencer le cours" }).click();
  await expect(page.locator("figure").first()).toBeVisible();
  await page.getByRole("button", { name: "Passer au quiz" }).click();

  await finishQuiz(page, /XP gagnés/);
  await expect(page.getByText("Du premier coup")).toBeVisible();

  await page.getByRole("link", { name: "Retour au parcours" }).click();
  await expect(page).toHaveURL(/\/learn/);
  const xpAfter = Number(await page.getByTitle("points d'expérience").first().locator(".tabular").innerText());
  expect(xpAfter).toBeGreaterThan(xpBefore);
  await expect(page.getByRole("link", { name: /, terminé/ }).first()).toBeVisible();

  // weekly review is now available and runs end to end
  await page.goto("/review");
  await page.getByRole("link", { name: "Lancer la révision" }).click();
  await finishQuiz(page, /XP gagnés/);
  await expect(page.getByText(/du premier coup/)).toBeVisible();
});

test("tracks can be switched and progress persists", async ({ page }) => {
  await login(page);
  await page.goto("/tracks");
  await page.getByRole("button", { name: /Fox/ }).click();
  await expect(page).toHaveURL(/\/learn/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("L'IA au travail");
  await page.goto("/tracks");
  await page.getByRole("button", { name: /Bird/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Premiers pas");
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Historique" })).toBeVisible();
});
