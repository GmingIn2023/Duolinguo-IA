import { describe, expect, it } from "vitest";
import { TRACKS } from "@/content";
import { buildPreviews } from "./landingPreview";

describe("landing previews come from real content", () => {
  const p = buildPreviews();

  it("shows a short lesson screen with bold key words", () => {
    expect(p.excerpt.body.match(/\*\*/g)?.length).toBeGreaterThanOrEqual(4);
    expect(p.excerpt.body.split(/\s+/).length).toBeLessThanOrEqual(45);
  });

  it("uses a real true/false question and highlights part of its explanation", () => {
    expect(p.quiz?.statement).toContain("assurance");
    expect(p.quiz?.mark.length).toBeGreaterThan(5);
  });

  it("names real chapters in the example result", () => {
    const names = TRACKS.gecko.chapters.map((c) => c.name);
    for (const n of [...p.example.validated, p.example.start]) expect(names).toContain(n);
  });

  it("derives the review schedule from the real Leitner intervals", () => {
    expect(p.reviewDays).toEqual([1, 3, 7, 14]);
  });
});
