import { describe, expect, it } from "vitest";
import { MIN_ANSWERED_RATIO, PASS_RATIO, REPLAY_WINDOW_HOURS, reviewPassed, srsUpdate } from "./progressRules";

const NOW = new Date("2026-10-17T10:00:00Z");
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

describe("reviewPassed", () => {
  it("passes with enough right answers on enough answered questions", () => {
    expect(reviewPassed({ correct: 6, answered: 10, expected: 10 })).toBe(true);
    expect(reviewPassed({ correct: 10, answered: 10, expected: 10 })).toBe(true);
  });

  it("does not pay a session where almost everything was missed", () => {
    expect(reviewPassed({ correct: 0, answered: 10, expected: 10 })).toBe(false);
    expect(reviewPassed({ correct: 5, answered: 10, expected: 10 })).toBe(false);
  });

  it("one lucky answer out of ten is not a passed checkpoint (a forged partial submission)", () => {
    expect(reviewPassed({ correct: 1, answered: 1, expected: 10 })).toBe(false);
    expect(reviewPassed({ correct: 5, answered: 5, expected: 10 })).toBe(false);
  });

  it("needs most questions answered even when every answer is right", () => {
    const need = Math.ceil(10 * MIN_ANSWERED_RATIO);
    expect(reviewPassed({ correct: need, answered: need, expected: 10 })).toBe(true);
    expect(reviewPassed({ correct: need - 1, answered: need - 1, expected: 10 })).toBe(false);
  });

  it("handles small sessions and empty ones", () => {
    expect(reviewPassed({ correct: 2, answered: 3, expected: 3 })).toBe(true);
    expect(reviewPassed({ correct: 1, answered: 3, expected: 3 })).toBe(false);
    expect(reviewPassed({ correct: 0, answered: 0, expected: 0 })).toBe(false);
  });

  it("keeps the documented thresholds", () => {
    expect(PASS_RATIO).toBe(0.6);
    expect(MIN_ANSWERED_RATIO).toBe(0.8);
    expect(REPLAY_WINDOW_HOURS).toBe(20);
  });
});

describe("srsUpdate", () => {
  it("schedules a notion seen for the first time", () => {
    expect(srsUpdate(null, true, NOW)?.box).toBe(2);
    expect(srsUpdate(null, false, NOW)?.box).toBe(1);
  });

  it("promotes a right answer only when the notion was due", () => {
    const due = { box: 2, lapses: 0, due_at: hoursFromNow(-1) };
    expect(srsUpdate(due, true, NOW)?.box).toBe(3);
  });

  it("five replays in a row cannot push a notion up: right answers on a notion that is not due change nothing", () => {
    let state = { box: 2, lapses: 0, due_at: hoursFromNow(48) };
    for (let i = 0; i < 5; i++) {
      const next = srsUpdate(state, true, NOW);
      expect(next).toBeNull();
    }
    expect(state.box).toBe(2);
    state = { box: 4, lapses: 1, due_at: hoursFromNow(1) };
    expect(srsUpdate(state, true, NOW)).toBeNull();
  });

  it("a miss always resets to box 1 and counts a lapse, even before the due date", () => {
    const notDue = { box: 5, lapses: 1, due_at: hoursFromNow(100) };
    const next = srsUpdate(notDue, false, NOW);
    expect(next?.box).toBe(1);
    expect(next?.lapses).toBe(2);
  });

  it("treats a missing due date as due", () => {
    expect(srsUpdate({ box: 1, lapses: 0, due_at: null }, true, NOW)?.box).toBe(2);
  });
});
