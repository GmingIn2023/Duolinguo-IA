import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ONBOARDING_KEY, saveOnboarding } from "./onboardingStorage";

describe("saveOnboarding", () => {
  it("stores the payload under the key the signup page reads", () => {
    const bag = new Map<string, string>();
    const payload = { placement: [{ id: "p1a", answer: "a" }, { id: "p1b", answer: null }], goal: "build" as const, tested: "fox" as const, track: "fox" as const };
    expect(saveOnboarding(payload, { setItem: (k, v) => void bag.set(k, v) })).toBe(true);
    expect(JSON.parse(bag.get(ONBOARDING_KEY)!)).toEqual(payload);
  });

  it("does not crash when storage is blocked", () => {
    const blocked = {
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(saveOnboarding({ placement: [], goal: null, tested: null, track: "bird" }, blocked)).toBe(false);
  });

  it("uses the same literal key as the signup form that reads it", () => {
    const form = readFileSync(path.resolve(import.meta.dirname, "..", "app", "signup", "SignupForm.tsx"), "utf8");
    expect(form).toContain(ONBOARDING_KEY);
  });
});
