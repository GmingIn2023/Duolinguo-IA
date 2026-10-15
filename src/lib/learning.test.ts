import { describe, expect, it } from "vitest";
import type { Lesson, Question } from "@/content/types";
import { gradeAnswer } from "./grading";
import { lessonXp, reviewXp } from "./xp";
import { nextReviewState, INTERVAL_DAYS } from "./srs";
import { pickWeeklyReview, isoWeekKey } from "./weekly";
import { PLACEMENT_POOL, gradePlacement, nextPlacementQuestion, placementLevel } from "./placement";
import { boardStatuses, boardSummary, coveredByLevel, isUnlocked } from "./board";
import { itemState, weakLessons } from "./mastery";
import { effectiveLevel, parsePreferences } from "./prefs";
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
  it("climbs after right answers and drops after misses", () => {
    const first = nextPlacementQuestion([], "seed")!;
    expect(first.band).toBe(2);
    const up = nextPlacementQuestion([{ id: first.id, correct: true }], "seed")!;
    expect(up.band).toBe(3);
    const down = nextPlacementQuestion([{ id: first.id, correct: false }], "seed")!;
    expect(down.band).toBe(1);
  });
  it("stops after 10 questions and never repeats one", () => {
    const history: { id: string; correct: boolean }[] = [];
    for (let i = 0; i < 12; i++) {
      const q = nextPlacementQuestion(history, "x");
      if (!q) break;
      expect(history.some((h) => h.id === q.id)).toBe(false);
      history.push({ id: q.id, correct: i % 2 === 0 });
    }
    expect(history).toHaveLength(10);
  });
  it("scores 10 only for a perfect test and 0 for no evidence", () => {
    const all = PLACEMENT_POOL.slice(0, 10).map((p) => ({ id: p.id, correct: true }));
    expect(placementLevel(all)).toBe(10);
    expect(placementLevel([])).toBe(0);
    const allWrong = PLACEMENT_POOL.filter((p) => p.band === 1).map((p) => ({ id: p.id, correct: false }));
    expect(placementLevel(allWrong)).toBe(0);
  });
  it("re-grades on the server and ignores unknown or repeated ids", () => {
    const q = PLACEMENT_POOL.find((p) => p.id === "p1b")!;
    expect(q.type).toBe("true_false");
    const steps = gradePlacement([
      { id: "p1b", answer: true },
      { id: "p1b", answer: false },
      { id: "nope", answer: "a" },
      { id: "p1a", answer: null },
    ]);
    expect(steps).toEqual([{ id: "p1b", correct: true }, { id: "p1a", correct: false }]);
  });
  it("ignores forged entries instead of crashing", () => {
    const forged = [null, 42, "p1b", { id: 7, answer: true }, { id: "p1b" }] as unknown as { id: string; answer: null }[];
    expect(gradePlacement(forged)).toEqual([{ id: "p1b", correct: false }]);
    expect(gradePlacement("nope" as unknown as [])).toEqual([]);
  });
});

describe("board", () => {
  const mk = (id: string, difficulty: 1 | 2 | 3 | 4 | 5, prerequisites: string[]): Lesson => ({
    id, title: id, objective: "", theme: "comprendre", difficulty, format: "notion", durationMin: 5, xp: 10, skills: [],
    prerequisites, sections: [], summary: [], questions: [], reviewQuestions: [], sources: [],
  });
  const lessons = [mk("l1", 1, []), mk("l2", 2, ["l1"]), mk("l3", 3, ["l2"]), mk("l4", 5, ["l3"])];
  const get = (id: string) => lessons.find((l) => l.id === id);
  const track = {
    id: "bird" as const, animal: "Bird", name: "T", audience: "", pitch: "", units: [{ id: "u", name: "U", blurb: "" }],
    nodes: [
      ...lessons.map((l, i) => ({ id: l.id, kind: "lesson" as const, lessonId: l.id, col: i, lane: 0, unit: "u" })),
      { id: "cp", kind: "checkpoint" as const, title: "Bilan", covers: ["l1", "l2"], col: 4, lane: 0, unit: "u" },
    ],
  };

  it("maps the level to what it lets a learner skip", () => {
    expect(coveredByLevel(1, 3)).toBe(false);
    expect(coveredByLevel(1, 4)).toBe(true);
    expect(coveredByLevel(3, 8)).toBe(true);
    expect(coveredByLevel(5, 10)).toBe(false);
  });
  it("locks by prerequisites and recommends exactly one open step", () => {
    const s = boardStatuses(track, { completed: new Set(["l1"]), level10: 0 }, get);
    expect(s.map((x) => x.status)).toEqual(["completed", "recommended", "locked", "locked", "locked"]);
    expect(s[2].missing.map((m) => m.id)).toEqual(["l2"]);
  });
  it("opens what the placement level covers, and the checkpoint once its lessons are known", () => {
    const s = boardStatuses(track, { completed: new Set(), level10: 6 }, get);
    expect(s.map((x) => x.status)).toEqual(["covered", "covered", "recommended", "locked", "available"]);
    expect(isUnlocked(lessons[2], { completed: new Set(), level10: 6 }, get)).toBe(true);
    expect(boardSummary(s).done).toBe(2);
  });
  it("prefers the learner's themes without breaking prerequisites", () => {
    const s = boardStatuses(track, { completed: new Set(["l1", "l2", "l3", "l4"]), level10: 0, checkpoints: new Set(["cp"]) }, get);
    expect(s.every((x) => x.status === "completed")).toBe(true);
    expect(boardSummary(s).finished).toBe(true);
  });
});

describe("written answers", () => {
  const q: Question = {
    id: "w", type: "written", prompt: "?", explanation: "", minCriteria: 2, modelAnswer: "",
    criteria: [
      { id: "a", label: "", anyOf: ["hasard"] },
      { id: "b", label: "", anyOf: ["probab"] },
    ],
  };
  it("matches ideas regardless of accents and case", () => {
    expect(gradeAnswer(q, "Une part de HASARD dans les Probabilités")).toBe(true);
    expect(gradeAnswer(q, "un peu de hasard")).toBe(false);
    expect(gradeAnswer(q, "x".repeat(5000) + " hasard probab")).toBe(false);
  });
});

describe("mastery and preferences", () => {
  it("classifies notions by box", () => {
    expect(itemState({ box: 1, lapses: 2 })).toBe("fragile");
    expect(itemState({ box: 3, lapses: 0 })).toBe("learning");
    expect(itemState({ box: 5, lapses: 0 })).toBe("mastered");
    const items = [
      { question_id: "a", lesson_id: "x", box: 1, lapses: 1, due_at: "" },
      { question_id: "b", lesson_id: "x", box: 1, lapses: 1, due_at: "" },
      { question_id: "c", lesson_id: "y", box: 1, lapses: 1, due_at: "" },
    ];
    expect(weakLessons(items)[0]).toEqual({ lessonId: "x", fragile: 2 });
  });
  it("parses stored preferences tolerantly", () => {
    expect(parsePreferences(null)).toEqual({ mode: "guided", themes: [], sessionMinutes: 10, pace: 0 });
    expect(parsePreferences({ mode: "free", themes: ["rag", "bogus", "rag"], sessionMinutes: 7, pace: 3 })).toEqual({ mode: "free", themes: ["rag"], sessionMinutes: 10, pace: 0 });
    expect(effectiveLevel(5, 1)).toBe(3);
    expect(effectiveLevel(9, -1)).toBe(10);
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
  it("rejects control characters browsers would strip into a protocol-relative URL", () => {
    for (const bad of ["/\t/evil.com", "/\n/evil.com", "/\r//evil.com", "/\u0000x"]) expect(safeNext(bad)).toBe("/learn");
    expect(safeNext("/review/checkpoint:u1?x=1#a")).toBe("/review/checkpoint:u1?x=1#a");
    expect(safeNext("/" + "a".repeat(600))).toBe("/learn");
  });
});
