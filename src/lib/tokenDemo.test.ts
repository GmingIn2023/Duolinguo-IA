import { describe, expect, it } from "vitest";
import { TOKEN_CANDIDATES, pickCandidate, pickCandidateExcept } from "./tokenDemo";

describe("token demo", () => {
  it("probabilities add up to 100", () => {
    expect(TOKEN_CANDIDATES.reduce((s, c) => s + c.p, 0)).toBe(100);
  });

  it("every candidate makes a sentence that reads on its own", () => {
    for (const c of TOKEN_CANDIDATES) {
      expect(c.word.length).toBeGreaterThan(2);
      expect(c.tail.endsWith(".")).toBe(true);
    }
  });
});

describe("pickCandidate", () => {
  it("uses the weighted ranges", () => {
    expect(pickCandidate(0)).toBe(0);
    expect(pickCandidate(39.9)).toBe(0);
    expect(pickCandidate(40)).toBe(1);
    expect(pickCandidate(61.9)).toBe(1);
    expect(pickCandidate(62)).toBe(2);
    expect(pickCandidate(99.9)).toBe(4);
  });
});

describe("pickCandidateExcept", () => {
  it("never returns the excluded candidate across the whole range", () => {
    for (let excluded = 0; excluded < TOKEN_CANDIDATES.length; excluded++) {
      for (let r = 0; r <= 100; r += 0.5) {
        expect(pickCandidateExcept(r, excluded)).not.toBe(excluded);
      }
    }
  });

  it("keeps the remaining weights ordered", () => {
    expect(pickCandidateExcept(0, 0)).toBe(1);
    expect(pickCandidateExcept(100, 0)).toBe(4);
    expect(pickCandidateExcept(0, 4)).toBe(0);
  });
});
