import { describe, expect, it } from "vitest";
import { buildPreviews } from "./landingPreview";

describe("landing previews come from real content", () => {
  const p = buildPreviews();

  it("finds a real annotated brief with its three short parts", () => {
    expect(p.brief).not.toBeNull();
    expect(p.brief!.lessonTitle.length).toBeGreaterThan(3);
    expect(p.brief!.parts.map((x) => x.label)).toEqual(["Tâche", "Critère de réussite", "Format"]);
    for (const part of p.brief!.parts) {
      expect(part.text.length).toBeGreaterThan(10);
      expect(part.detail.length).toBeGreaterThan(10);
    }
  });

  it("uses a real true/false question with its explanation", () => {
    expect(p.quiz?.statement).toContain("information fausse");
    expect(p.quiz?.explanation.length).toBeGreaterThan(20);
  });

  it("derives the review schedule from the real Leitner intervals", () => {
    expect(p.reviewDays).toEqual([1, 3, 7, 14]);
  });
});
