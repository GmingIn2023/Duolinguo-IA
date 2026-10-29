import { describe, expect, it } from "vitest";
import { ATELIER } from "@/content/atelier";
import { canSend, dealCards, gradeMission, likelyAnswer, maxCards, toggleCard } from "./atelier";

const diner = ATELIER.bird[0];

describe("atelier rules", () => {
  it("swaps cards of the same group and stops at a full hand", () => {
    let picked = toggleCard(diner, [], "t2");
    picked = toggleCard(diner, picked, "t1");
    expect(picked).toEqual(["t1"]);
    for (const id of ["c1", "l1", "f1", "r1"]) picked = toggleCard(diner, picked, id);
    expect(picked).toHaveLength(maxCards(diner));
    expect(picked).not.toContain("r1");
    expect(toggleCard(diner, picked, "f1")).not.toContain("f1");
  });

  it("needs a task before sending", () => {
    expect(canSend(diner, ["c1"])).toBe(false);
    expect(canSend(diner, ["c1", "t1"])).toBe(true);
  });

  it("puts the task first in the likely answer and keeps notes apart", () => {
    const sms = ATELIER.bird[1];
    const answer = likelyAnswer(sms, ["f1", "c1", "t1"]);
    expect(answer.lines[0]).toBe(sms.cards.find((c) => c.id === "t1")!.adds);
    expect(answer.notes).toEqual(["Le message tient en trois phrases."]);
  });

  it("grades three stars for every key and no trap, and takes one off for a trap or a missing key", () => {
    expect(gradeMission(diner, ["t1", "c1", "l1", "f1"]).stars).toBe(3);
    expect(gradeMission(diner, ["t1", "c1", "l1", "r1"]).stars).toBe(2);
    expect(gradeMission(diner, ["t1", "c1", "f1"]).stars).toBe(2);
    expect(gradeMission(diner, ["t2", "r1", "p1"]).stars).toBe(1);
  });

  it("deals the same order every time", () => {
    expect(dealCards(diner).map((c) => c.id)).toEqual(dealCards(diner).map((c) => c.id));
    expect(dealCards(diner)).toHaveLength(diner.cards.length);
  });
});

describe("atelier missions", () => {
  const all = Object.values(ATELIER).flat();
  it.each(all.map((m) => [m.id, m] as const))("%s can be won, and has something to get wrong", (_, m) => {
    const ids = m.cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const keys = m.cards.filter((c) => c.effect === "key");
    expect(keys.some((c) => c.kind === "tache")).toBe(true);
    expect(gradeMission(m, keys.map((c) => c.id)).stars).toBe(3);
    expect(m.cards.some((c) => c.effect === "trap")).toBe(true);
    expect(m.cards.length).toBeGreaterThan(maxCards(m));
    for (const c of m.cards) expect(c.why.length).toBeGreaterThan(0);
  });
  it("gives every track four missions", () => {
    for (const missions of Object.values(ATELIER)) expect(missions).toHaveLength(4);
  });
});
