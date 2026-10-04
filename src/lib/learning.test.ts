import { describe, expect, it } from "vitest";
import type { Lesson, Question } from "@/content/types";
import { gradeAnswer } from "./grading";
import { lessonXp, reviewXp } from "./xp";
import { nextReviewState, INTERVAL_DAYS } from "./srs";
import { pickWeeklyReview, isoWeekKey } from "./weekly";
import { estimatePlacement } from "./placement";
import { lessonStatuses } from "./unlock";
import { nextStreak } from "./streak";

const mcq: Question = {
  id: "q1",
  type: "mcq",
  prompt: "?",
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ],
  answer: "b",
  explanation: "",
};

describe("gradeAnswer", () => {
  it("grades single-choice questions", () => {
    expect(gradeAnswer(mcq, "b")).toBe(true);
    expect(gradeAnswer(mcq, "a")).toBe(false);
  });
  it("grades true/false", () => {
    const q: Question = { id: "t", type: "true_false", statement: "", answer: false, explanation: "" };
    expect(gradeAnswer(q, false)).toBe(true);
    expect(gradeAnswer(q, true)).toBe(false);
  });
  it("requires exact sequence for ordering and ranking", () => {
    const q: Question = {
      id: "o",
      type: "ordering",
      prompt: "",
      items: [
        { id: "x", text: "" },
        { id: "y", text: "" },
      ],
      answer: ["x", "y"],
      explanation: "",
    };
    expect(gradeAnswer(q, ["x", "y"])).toBe(true);
    expect(gradeAnswer(q, ["y", "x"])).toBe(false);
  });
  it("uses set equality for multi-select AI analysis", () => {
    const q: Question = {
      id: "a",
      type: "ai_analysis",
      prompt: "",
      userMessage: "",
      aiResponse: "",
      options: [],
      answer: ["p", "q"],
      explanation: "",
    };
    expect(gradeAnswer(q, ["q", "p"])).toBe(true);
    expect(gradeAnswer(q, ["p"])).toBe(false);
    expect(gradeAnswer(q, ["p", "q", "r"])).toBe(false);
  });
  it("rejects answers of the wrong shape", () => {
    expect(gradeAnswer(mcq, ["b"])).toBe(false);
    expect(gradeAnswer(mcq, true)).toBe(false);
  });
});

describe("xp", () => {
  it("scales lesson XP with first-try accuracy", () => {
    expect(lessonXp({ baseXp: 20, correct: 5, total: 5, alreadyCompleted: false })).toBe(20);
    expect(lessonXp({ baseXp: 20, correct: 0, total: 5, alreadyCompleted: false })).toBe(10);
  });
  it("gives a small practice bonus on replays", () => {
    expect(lessonXp({ baseXp: 20, correct: 5, total: 5, alreadyCompleted: true })).toBe(4);
  });
  it("gives review XP per correct answer", () => {
    expect(reviewXp(7)).toBe(14);
  });
});

describe("srs", () => {
  const now = new Date("2026-10-05T10:00:00Z");
  it("promotes a correct item and schedules it further out", () => {
    const s = nextReviewState({ box: 2, lapses: 0 }, true, now);
    expect(s.box).toBe(3);
    expect(s.dueAt.getTime() - now.getTime()).toBe(INTERVAL_DAYS[3] * 86_400_000);
  });
  it("sends a wrong item back to box 1 and counts a lapse", () => {
    const s = nextReviewState({ box: 4, lapses: 1 }, false, now);
    expect(s).toMatchObject({ box: 1, lapses: 2 });
  });
  it("caps the box", () => {
    expect(nextReviewState({ box: 6, lapses: 0 }, true, now).box).toBe(6);
  });
  it("starts new items at box 1 (wrong) or 2 (right)", () => {
    expect(nextReviewState(null, true, now).box).toBe(2);
    expect(nextReviewState(null, false, now).box).toBe(1);
  });
});

describe("weekly review", () => {
  const items = [
    { questionId: "a1", lessonId: "A", box: 1, lapses: 3 },
    { questionId: "a2", lessonId: "A", box: 2, lapses: 0 },
    { questionId: "a3", lessonId: "A", box: 3, lapses: 0 },
    { questionId: "a4", lessonId: "A", box: 4, lapses: 0 },
    { questionId: "b1", lessonId: "B", box: 5, lapses: 0 },
    { questionId: "b2", lessonId: "B", box: 1, lapses: 1 },
  ];
  it("prioritises weak items and spreads across lessons", () => {
    const picked = pickWeeklyReview(items, 4);
    expect(picked).toHaveLength(4);
    expect(picked[0]).toBe("a1");
    expect(picked).toContain("b2");
    expect(picked).toContain("b1");
  });
  it("returns everything when there is less than the target", () => {
    expect(pickWeeklyReview(items.slice(0, 2), 12)).toHaveLength(2);
  });
  it("computes ISO week keys", () => {
    expect(isoWeekKey(new Date("2026-10-04T12:00:00Z"))).toBe("2026-W40");
    expect(isoWeekKey(new Date("2026-01-01T12:00:00Z"))).toBe("2026-W01");
  });
});

describe("placement", () => {
  it("maps situation to a track and knowledge to a level", () => {
    expect(estimatePlacement({ situation: "work", usage: "often", knowledge: 2 })).toEqual({ track: "fox", level: 3 });
    expect(estimatePlacement({ situation: "student", usage: "never", knowledge: 0 })).toEqual({ track: "gecko", level: 1 });
    expect(estimatePlacement({ situation: "curious", usage: "sometimes", knowledge: 1 })).toEqual({ track: "bird", level: 2 });
  });
});

describe("lessonStatuses", () => {
  const mk = (id: string, level: 1 | 2 | 3, prerequisites: string[]): Lesson => ({
    id,
    title: id,
    objective: "",
    level,
    durationMin: 5,
    xp: 10,
    skills: [],
    prerequisites,
    blocks: [],
    questions: [],
  });
  const lessons = [mk("l1", 1, []), mk("l2", 1, ["l1"]), mk("l3", 2, ["l2"]), mk("l4", 3, ["l3"])];

  it("unlocks by prerequisites and marks the first open lesson as current", () => {
    const s = lessonStatuses(lessons, new Set(["l1"]), 1);
    expect(s.map((x) => x.status)).toEqual(["completed", "current", "locked", "locked"]);
  });
  it("lets placement skip ahead below the placed level", () => {
    const s = lessonStatuses(lessons, new Set(), 2);
    expect(s.map((x) => x.status)).toEqual(["current", "available", "locked", "locked"]);
  });
  it("has no current lesson when everything is done", () => {
    const s = lessonStatuses(lessons, new Set(["l1", "l2", "l3", "l4"]), 1);
    expect(s.every((x) => x.status === "completed")).toBe(true);
  });
});

describe("streak", () => {
  it("continues, keeps, or resets", () => {
    expect(nextStreak(3, "2026-10-03", "2026-10-04")).toBe(4);
    expect(nextStreak(3, "2026-10-04", "2026-10-04")).toBe(3);
    expect(nextStreak(3, "2026-10-01", "2026-10-04")).toBe(1);
    expect(nextStreak(0, null, "2026-10-04")).toBe(1);
  });
});

import { frenchSpacing } from "./typo";
describe("frenchSpacing", () => {
  it("binds French punctuation to its word", () => {
    expect(frenchSpacing("« Vrai ? » oui : non !")).toBe("« Vrai ? » oui : non !");
  });
});
describe("frenchSpacing hyphens", () => {
  it("keeps inversions together", () => {
    expect(frenchSpacing("Qu'est-ce que c'est")).toBe("Qu'est‑ce que c'est");
  });
});

import { safeNext } from "./safeNext";
describe("safeNext", () => {
  it("keeps internal paths and rejects external redirects", () => {
    expect(safeNext("/review")).toBe("/review");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "", null]) expect(safeNext(bad)).toBe("/learn");
  });
});
