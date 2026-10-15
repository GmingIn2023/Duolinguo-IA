import { expect, type Locator, type Page } from "@playwright/test";
import { LESSONS } from "../src/content";
import type { Question } from "../src/content/types";
import { PLACEMENT_POOL } from "../src/lib/placement";

// Answers any question on screen from the course content itself, like a learner who knows the course.
// The question is found by its heading, then disambiguated by the options visible next to it.

/** Text as rendered: inline marks removed, typographic spaces and hyphens flattened. */
export const norm = (s: string) =>
  s
    .replace(/\*\*|`/g, "")
    .replace(/(^|[^\w*])\*([^\s*][^*\n]*?)\*(?![\w*])/g, "$1$2")
    .replace(/[   ]/g, " ")
    .replace(/‑/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const ALL: Question[] = [
  ...LESSONS.flatMap((l) => [
    ...l.questions,
    ...l.reviewQuestions,
    ...l.sections.flatMap((s) => s.blocks.flatMap((b) => (b.type === "check" ? [b.question] : []))),
  ]),
  ...PLACEMENT_POOL,
];

const heading = (q: Question) => norm("prompt" in q ? q.prompt : q.statement);
const visibleTexts = (q: Question): string[] => {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
    case "multi":
    case "ai_analysis":
      return q.options.map((o) => o.text);
    case "ordering":
    case "ranking":
      return q.items.map((i) => i.text);
    case "match":
      return q.left.map((i) => i.text);
    default:
      return [];
  }
};

async function identify(scope: Locator): Promise<Question> {
  const title = norm(await scope.locator("h2").first().innerText());
  const text = norm(await scope.innerText());
  const candidates = ALL.filter((q) => {
    const h = heading(q);
    return title.includes(h) || h.includes(title.replace(/^«\s*|\s*»$/g, ""));
  });
  const fit = candidates.filter((q) => visibleTexts(q).every((t) => text.includes(norm(t))));
  expect(fit.length, `question not found for heading « ${title} »`).toBeGreaterThan(0);
  return fit[0];
}

async function clickByText(buttons: Locator, wanted: string) {
  // exact text first (« Format » must not match « information »), then the label inside a richer button
  const full = (await buttons.allInnerTexts()).map(norm);
  // keyboard hint number before, "associé à" badge after: neither is part of the label
  const bare = full.map((t) => t.replace(/^\d+\s+/, ""));
  const w = norm(wanted);
  const exact = bare.findIndex((t) => t === w || t.replace(/\s+\d+$/, "") === w);
  const at = exact !== -1 ? exact : full.findIndex((t) => t.includes(w));
  if (at !== -1) {
    await buttons.nth(at).click();
    return;
  }
  throw new Error(`no control with text « ${wanted} »`);
}

/** Puts the right answer in the question shown inside `scope`. */
export async function answerCorrectly(scope: Locator) {
  const q = await identify(scope);
  switch (q.type) {
    case "mcq":
    case "fill_choice":
      return clickByText(scope.getByRole("radio"), q.options.find((o) => o.id === q.answer)!.text);
    case "true_false":
      return scope.getByRole("radio", { name: q.answer ? /Vrai/ : /Faux/ }).click();
    case "multi":
    case "ai_analysis":
      for (const id of q.answer) await clickByText(scope.getByRole("checkbox"), q.options.find((o) => o.id === id)!.text);
      return;
    case "ordering":
    case "ranking": {
      const wanted = q.answer.map((id) => norm(q.items.find((i) => i.id === id)!.text));
      for (let target = 0; target < wanted.length; target++) {
        for (let guard = 0; guard < wanted.length; guard++) {
          const rows = scope.locator("ol > li");
          const texts = (await rows.allInnerTexts()).map(norm);
          const at = texts.findIndex((t) => t.includes(wanted[target]));
          if (at <= target) break;
          await rows.nth(at).getByRole("button", { name: /^Monter/ }).click();
        }
      }
      return;
    }
    case "match":
      for (let i = 0; i < q.left.length; i++) {
        await scope.getByRole("list", { name: "Éléments à associer" }).getByRole("button").nth(i).click();
        await clickByText(scope.getByRole("list", { name: "Partenaires possibles" }).getByRole("button"), q.right.find((r) => r.id === q.answer[i])!.text);
      }
      return;
    case "written":
      // the first fragment of every criterion: graded on ideas, so this meets them all
      return scope.getByRole("textbox", { name: "Ta réponse" }).fill(`${q.modelAnswer} ${q.criteria.map((c) => c.anyOf[0]).join(" ")}`);
  }
}

/** The smallest block holding the question and its "Vérifier" button. */
const scopeOf = (verify: Locator) => verify.locator("xpath=ancestor::div[.//h2][1]");

/** Answers one quiz step: check, then continue past the correction. */
export async function solveStep(page: Page, wrongFirst = false) {
  // pin the question's block: once checked, "Vérifier" is gone and could not locate it again
  await page.locator("[data-e2e-scope]").evaluateAll((els) => els.forEach((el) => el.removeAttribute("data-e2e-scope")));
  await scopeOf(page.getByRole("button", { name: "Vérifier", exact: true }).first()).evaluate((el) => el.setAttribute("data-e2e-scope", ""));
  const scope = page.locator("[data-e2e-scope]");
  const verify = scope.getByRole("button", { name: "Vérifier", exact: true });
  if (wrongFirst) {
    // a deliberate miss on the first radio/checkbox when it is not the right one is enough to test the retry loop
    const first = scope.getByRole("radio").or(scope.getByRole("checkbox")).first();
    if (await first.count()) await first.click();
  }
  const answeredRight = !wrongFirst || !(await verify.isEnabled());
  if (answeredRight) await answerCorrectly(scope);
  await verify.click();
  if (answeredRight) await expect(scope.getByRole("status")).toContainText(/Juste|Les idées y sont/);
  await scope.getByRole("button", { name: "Continuer", exact: true }).click();
  await scope.evaluateAll((els) => els.forEach((el) => el.removeAttribute("data-e2e-scope")));
}

/** Runs a full quiz until `done` shows, answering everything right except the first question when `missOne`. */
export async function finishQuiz(page: Page, done: RegExp, { missOne = false } = {}) {
  for (let i = 0; i < 80; i++) {
    if (await page.getByRole("heading", { name: done }).isVisible().catch(() => false)) return;
    const again = page.getByRole("button", { name: "C'est parti" });
    if (await again.isVisible().catch(() => false)) {
      await again.click();
      continue;
    }
    if (await page.getByRole("button", { name: "Vérifier", exact: true }).first().isVisible().catch(() => false)) {
      await solveStep(page, missOne && i === 0);
      continue;
    }
    await page.waitForTimeout(250);
  }
  await expect(page.getByRole("heading", { name: done })).toBeVisible();
}

/** Answers every in-lesson check of the current section so "Suivant" unlocks. */
export async function answerSectionChecks(page: Page) {
  for (let i = 0; i < 6; i++) {
    const verify = page.getByRole("button", { name: "Vérifier", exact: true });
    if (!(await verify.count())) return;
    await solveStep(page);
  }
}
