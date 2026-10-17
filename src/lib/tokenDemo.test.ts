import { describe, expect, it } from "vitest";
import { TOKEN_CANDIDATES, pickCandidate } from "./tokenDemo";

describe("token demo", () => {
  it("probabilities add up to 100", () => {
    expect(TOKEN_CANDIDATES.reduce((s, c) => s + c.p, 0)).toBe(100);
  });

  it("draws each word over its own slice of [0, 100)", () => {
    expect(pickCandidate(0)).toBe(0);
    expect(pickCandidate(39.9)).toBe(0);
    expect(pickCandidate(40)).toBe(1);
    expect(pickCandidate(61.9)).toBe(1);
    expect(pickCandidate(62)).toBe(2);
    expect(pickCandidate(99.9)).toBe(4);
  });

  it("every candidate makes a sentence that reads on its own", () => {
    for (const c of TOKEN_CANDIDATES) {
      expect(c.word.length).toBeGreaterThan(2);
      expect(c.tail.endsWith(".")).toBe(true);
    }
  });
});
