import { describe, expect, it } from "vitest";
import { PLACEMENT_LENGTH, nextPlacementQuestion, placementLevel, type PlacementStep } from "./placement";
import { gaugeSegments, suggestTrack, trackForLevel } from "./placementFlow";

/** Plays the whole test with an answering strategy, the way the landing does. */
function play(correct: (index: number) => boolean, seed = "t") {
  const history: PlacementStep[] = [];
  for (let q = nextPlacementQuestion(history, seed); q; q = nextPlacementQuestion(history, seed)) history.push({ id: q.id, correct: correct(history.length) });
  return history;
}

describe("level test flow", () => {
  it("runs exactly ten questions, never repeating one", () => {
    const history = play(() => true);
    expect(history).toHaveLength(PLACEMENT_LENGTH);
    expect(new Set(history.map((h) => h.id)).size).toBe(PLACEMENT_LENGTH);
  });

  it("scores 10 when everything is right and 0 when nothing is known", () => {
    expect(placementLevel(play(() => true))).toBe(10);
    expect(placementLevel(play(() => false))).toBe(0);
  });

  it("a learner who gets the first half right scores higher than one who misses it", () => {
    const strong = placementLevel(play((i) => i < 5));
    const weak = placementLevel(play((i) => i >= 5));
    expect(strong).toBeGreaterThan(weak);
  });
});

describe("suggested track", () => {
  it("follows the stated goal, whatever the level", () => {
    expect(suggestTrack("discover", 10)).toBe("bird");
    expect(suggestTrack("practice", 0)).toBe("gecko");
    expect(suggestTrack("build", 2)).toBe("fox");
  });

  it("follows the level, with the same thresholds as /onboarding, when no goal was given", () => {
    expect([0, 2, 3, 5, 6, 10].map((l) => suggestTrack(null, l))).toEqual(["bird", "bird", "gecko", "gecko", "fox", "fox"]);
    expect(trackForLevel(5)).toBe("gecko");
  });
});

describe("gauge", () => {
  it("always has ten segments and fills exactly the level", () => {
    for (const level of [0, 1, 4, 7, 10]) {
      const segments = gaugeSegments(level);
      expect(segments).toHaveLength(10);
      expect(segments.filter((s) => s.filled)).toHaveLength(level);
    }
  });

  it("clamps out-of-range levels and colours each segment by its track", () => {
    expect(gaugeSegments(14).filter((s) => s.filled)).toHaveLength(10);
    expect(gaugeSegments(-3).filter((s) => s.filled)).toHaveLength(0);
    expect(gaugeSegments(10).map((s) => s.track)).toEqual(["bird", "bird", "gecko", "gecko", "gecko", "fox", "fox", "fox", "fox", "fox"]);
  });
});
