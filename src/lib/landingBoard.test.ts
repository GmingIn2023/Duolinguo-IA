import { describe, expect, it } from "vitest";
import { LESSONS, TRACK_IDS, TRACKS } from "@/content";
import { buildLandingPlan } from "./landingBoard";

const plan = buildLandingPlan();

describe("landing plan, built from the real curriculum", () => {
  it("quotes the real number of lessons", () => {
    expect(plan.uniqueLessons).toBe(LESSONS.length);
  });

  it("counts each track's lessons like the track itself (checkpoints are not lessons)", () => {
    for (const id of TRACK_IDS) {
      expect(plan.boards[id].lessons).toBe(TRACKS[id].nodes.filter((n) => n.lessonId).length);
    }
  });

  it("only links nodes that exist on the same track, and never a node to itself", () => {
    for (const id of TRACK_IDS) {
      const ids = new Set(plan.boards[id].nodes.map((n) => n.id));
      for (const n of plan.boards[id].nodes) {
        for (const f of n.from) {
          expect(ids.has(f), `${id}: ${n.id} <- ${f}`).toBe(true);
          expect(f).not.toBe(n.id);
        }
      }
    }
  });

  it("links every node except the first column, so no stop floats alone", () => {
    for (const id of TRACK_IDS) {
      for (const n of plan.boards[id].nodes) {
        if (n.col === 0) continue;
        expect(n.from.length, `${id}: ${n.id} has no incoming link`).toBeGreaterThan(0);
      }
    }
  });

  it("only links forward along the map (left to right)", () => {
    for (const id of TRACK_IDS) {
      const col = new Map(plan.boards[id].nodes.map((n) => [n.id, n.col]));
      for (const n of plan.boards[id].nodes) for (const f of n.from) expect(col.get(f)!, `${id}: ${f} -> ${n.id}`).toBeLessThan(n.col);
    }
  });

  it("marks shared lessons, and the themes cover every lesson exactly once", () => {
    const perTrack = TRACK_IDS.flatMap((id) => plan.boards[id].nodes.filter((n) => n.kind !== "checkpoint"));
    expect(perTrack.some((n) => n.shared)).toBe(true);
    expect(plan.themes.reduce((sum, t) => sum + t.lessons, 0)).toBe(LESSONS.length);
  });

  it("gives every unit at least one node and orders its columns", () => {
    for (const id of TRACK_IDS) for (const u of plan.boards[id].units) expect(u.fromCol).toBeLessThanOrEqual(u.toCol);
  });
});
