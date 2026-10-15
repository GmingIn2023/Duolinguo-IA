import { expect, test } from "@playwright/test";
import { LESSONS } from "../src/content";
import { solveStep } from "./quiz";

// Development server only (the preview route is 404 in production): plays every question of every
// lesson — quiz, review forms and in-lesson checks — through the real quiz UI, answering from the
// content, and expects each answer to be accepted on the first try. Catches answers the UI cannot
// express or grades wrongly (written criteria, ordering, matching…).
// Run: E2E_SWEEP=1 BASE_URL=http://localhost:3123 npx playwright test content-sweep --project=desktop

test.describe.configure({ mode: "parallel" });

for (const lesson of LESSONS) {
  test(`every question of « ${lesson.id} » is answerable and accepted`, async ({ page }, info) => {
    test.skip(!process.env.E2E_SWEEP || info.project.name !== "desktop", "set E2E_SWEEP=1 against a dev server");
    const count = lesson.questions.length + lesson.reviewQuestions.length + lesson.sections.flatMap((s) => s.blocks.filter((b) => b.type === "check")).length;
    await page.goto(`/dev/preview?view=quiz&pool=all&id=${lesson.id}`);
    for (let i = 0; i < count; i++) {
      await solveStep(page);
      await expect(page.getByText("On la reprend.")).toHaveCount(0);
    }
  });
}
