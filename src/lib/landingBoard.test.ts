import { describe, expect, it } from "vitest";
import { LESSONS, TRACKS, TRACK_IDS } from "@/content";
import { buildLandingPlan } from "./landingBoard";

describe("landing plan", () => {
  const plan = buildLandingPlan();

  it("draws every chapter and lesson of each track, in order", () => {
    for (const id of TRACK_IDS) {
      expect(plan.tracks[id].chapters.map((c) => c.id)).toEqual(TRACKS[id].chapters.map((c) => c.id));
      expect(plan.tracks[id].chapters.flatMap((c) => c.lessons.map((l) => l.id))).toEqual(TRACKS[id].chapters.flatMap((c) => c.lessons));
    }
  });

  it("counts each lesson once", () => {
    expect(TRACK_IDS.reduce((n, id) => n + plan.tracks[id].lessons, 0)).toBe(LESSONS.length);
    expect(plan.totalLessons).toBe(LESSONS.length);
  });

  it("lists every theme with the tracks where it appears", () => {
    expect(plan.themes).toHaveLength(10);
    for (const t of plan.themes) expect(t.tracks.length).toBeGreaterThan(0);
  });
});
