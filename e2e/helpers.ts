import { expect, type Page } from "@playwright/test";

/** A confirmed test account, provided through the environment (never committed). */
export const E2E_USER = { email: process.env.E2E_EMAIL ?? "", password: process.env.E2E_PASSWORD ?? "" };
export const HAS_E2E_USER = Boolean(E2E_USER.email && E2E_USER.password);

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_USER.email);
  await page.getByLabel("Mot de passe").fill(E2E_USER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/learn/, { timeout: 20_000 });
}
