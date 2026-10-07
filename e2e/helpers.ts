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

/** Correct answers learned from the correction sheet, keyed by question heading. */
export type Memory = Map<string, string[]>;

async function applyKnownAnswer(page: Page, lines: string[]) {
  const clean = lines.map((l) => l.replace(/^(\d+\.|•)\s*/, "").trim());
  const upButtons = page.getByRole("button", { name: /^Monter/ });
  if (await upButtons.count()) {
    // ordering / ranking: bubble each expected item up to its slot
    for (let target = 0; target < clean.length; target++) {
      for (let guard = 0; guard < 6; guard++) {
        const items = await page.locator("ol li").allInnerTexts();
        const at = items.findIndex((t) => t.includes(clean[target]));
        if (at <= target) break;
        await page.getByRole("button", { name: `Monter « ${clean[target]} »` }).click();
      }
    }
    return;
  }
  const role = (await page.getByRole("checkbox").count()) ? "checkbox" : "radio";
  for (const text of clean) await page.getByRole(role, { name: text, exact: false }).first().click();
}

/** Answers the question on screen: first try deliberately mixed, retries use the shown correction. */
async function answerCurrent(page: Page, memory: Memory, tryWrong: boolean) {
  // identify the question by its full visible content (several share the same heading)
  const heading = (await page.locator("main .fade-in").first().innerText()).replace("Deuxième essai sur cette question.", "").replace(/\s+/g, " ").trim();
  const known = memory.get(heading);
  if (known) {
    await applyKnownAnswer(page, known);
  } else if (await page.getByRole("checkbox").count()) {
    await page.getByRole("checkbox").first().click();
  } else if (await page.getByRole("radio").count()) {
    await page.getByRole("radio").nth(tryWrong ? 1 : 0).click();
  } // ordering/ranking are pre-filled: checking as-is is a valid (wrong) attempt

  await page.getByRole("button", { name: "Vérifier" }).click();
  const sheet = page.getByRole("status");
  if (await sheet.getByText("Bonne réponse :").isVisible().catch(() => false)) {
    const answer = await sheet.locator("p.whitespace-pre-line").innerText();
    memory.set(heading, answer.split("\n").filter(Boolean));
  }
  await page.getByRole("button", { name: "Continuer" }).click();
}

/** Runs a quiz to completion, whatever the mix of right and wrong answers. Pass a shared memory to reuse corrections seen earlier. */
export async function finishQuiz(page: Page, done: RegExp, memory: Memory = new Map()) {
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole("heading", { name: done }).isVisible().catch(() => false)) return;
    const retry = page.getByRole("button", { name: "C'est parti" });
    if (await retry.isVisible().catch(() => false)) {
      await retry.click();
      continue;
    }
    if (await page.getByRole("button", { name: "Vérifier" }).isVisible().catch(() => false)) {
      await answerCurrent(page, memory, i % 3 === 0);
      continue;
    }
    await page.waitForTimeout(300);
  }
  await expect(page.getByRole("heading", { name: done })).toBeVisible();
}
