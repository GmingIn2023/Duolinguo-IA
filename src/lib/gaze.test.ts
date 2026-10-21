import { describe, expect, it } from "vitest";
import { gazeOffset } from "./gaze";

describe("gazeOffset", () => {
  it("does not move the eyes when the pointer is exactly on the mascot", () => {
    expect(gazeOffset(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it("leans toward the pointer and never beyond the maximum", () => {
    const far = gazeOffset(5000, 0);
    expect(far).toEqual({ x: 2.2, y: 0 });
    const diagonal = gazeOffset(-4000, -4000);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeLessThanOrEqual(2.2 + 0.01);
    expect(diagonal.x).toBeLessThan(0);
    expect(diagonal.y).toBeLessThan(0);
  });

  it("eases off close to the mascot", () => {
    const near = gazeOffset(20, 0);
    const mid = gazeOffset(80, 0);
    expect(near.x).toBeGreaterThan(0);
    expect(near.x).toBeLessThan(mid.x);
    expect(mid.x).toBeLessThan(2.2);
  });

  it("respects a custom maximum and reach", () => {
    expect(gazeOffset(100, 0, 4, 100)).toEqual({ x: 4, y: 0 });
    expect(gazeOffset(0, 50, 4, 100)).toEqual({ x: 0, y: 2 });
  });
});
