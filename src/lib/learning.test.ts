import { describe, expect, it } from "vitest";
import type { Lesson, Question, Track } from "@/content/types";
import { gradeAnswer } from "./grading";
import { lessonXp, reviewXp } from "./xp";
import { nextReviewState, INTERVAL_DAYS } from "./srs";
import { pickWeeklyReview, isoWeekKey } from "./weekly";
import { COMMON_POOL, PLACEMENT_LENGTH, gradePlacement, placementTest, placementVerdict, testedChapters, type PlacementQuestion } from "./placement";
import { canOpenLesson, knowledgeFrom, trackPath } from "./path";
import { itemState, weakLessons } from "./mastery";
import { DEFAULT_PREFERENCES, parsePreferences, readPlacements } from "./prefs";
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
  const right = (q: PlacementQuestion) => {
    switch (q.type) {
      case "mcq":
      case "fill_choice":
      case "true_false":
        return q.answer;
      case "multi":
      case "ordering":
        return q.answer;
      case "sort":
        return q.answer.map(String);
      default:
        return null;
    }
  };

  it("builds 10 questions per track: shared first, the special one third, then one per tested chapter in order", () => {
    for (const track of ["bird", "gecko", "fox"] as const) {
      const test = placementTest(track, "seed");
      expect(test).toHaveLength(PLACEMENT_LENGTH);
      expect(test[2].id).toBe("c-deux");
      const chapters = test.filter((q) => q.chapter).map((q) => q.chapter);
      expect(chapters).toEqual(testedChapters(track));
      expect(new Set(test.map((q) => q.id)).size).toBe(PLACEMENT_LENGTH);
    }
    expect(testedChapters("fox")).toHaveLength(6);
    expect(placementTest("fox", "a").filter((q) => !q.chapter)).toHaveLength(4);
  });

  it("validates exactly the chapters answered right and scores out of 10", () => {
    const test = placementTest("gecko", "s");
    const answers = test.map((q, i) => ({ id: q.id, answer: i === 6 ? null : right(q) }));
    const r = gradePlacement("gecko", answers);
    expect(r.score).toBe(9);
    expect(r.chapters).toEqual(testedChapters("gecko").filter((c) => c !== test[6].chapter));
  });

  it("ignores questions of another track, repeats, extra shared questions and forged entries", () => {
    const fox = placementTest("fox", "x").find((q) => q.chapter)!;
    const bird = placementTest("bird", "x");
    const answers = [
      { id: fox.id, answer: right(fox) },
      ...bird.map((q) => ({ id: q.id, answer: right(q) })),
      { id: bird[0].id, answer: right(bird[0]) },
      ...COMMON_POOL.map((q) => ({ id: q.id, answer: right(q) })),
      null,
      { id: 3 },
      "nope",
    ];
    const r = gradePlacement("bird", answers);
    expect(r.score).toBe(10);
    expect(r.chapters).toEqual(testedChapters("bird"));
    expect(gradePlacement("bird", "garbage").score).toBe(0);
  });

  it("recommends the next track, the previous one, or a starting chapter", () => {
    expect(placementVerdict("bird", { score: 10, chapters: testedChapters("bird") })).toEqual({ kind: "next", track: "gecko" });
    expect(placementVerdict("fox", { score: 10, chapters: testedChapters("fox") }).kind).toBe("start");
    expect(placementVerdict("fox", { score: 2, chapters: [] })).toEqual({ kind: "previous", track: "gecko" });
    expect(placementVerdict("bird", { score: 1, chapters: [] })).toEqual({ kind: "start", chapter: "b1" });
    expect(placementVerdict("gecko", { score: 6, chapters: ["g1", "g2"] })).toEqual({ kind: "start", chapter: "g3" });
    // a hole: the start is the first chapter not validated
    expect(placementVerdict("gecko", { score: 6, chapters: ["g1", "g3"] })).toEqual({ kind: "start", chapter: "g2" });
  });
});

describe("path", () => {
  const mk = (id: string): Lesson => ({
    id, title: id, objective: "", theme: "comprendre", difficulty: 1, format: "notion", durationMin: 4, xp: 10, skills: [],
    sections: [], summary: [], questions: [], reviewQuestions: [], sources: [],
  });
  const lessons = ["a1", "a2", "b1", "b2", "p1"].map(mk);
  const get = (id: string) => lessons.find((l) => l.id === id);
  const track: Track = {
    id: "bird", animal: "Bird", name: "T", audience: "", pitch: "",
    chapters: [
      { id: "A", name: "Alpha", blurb: "", lessons: ["a1", "a2"] },
      { id: "B", name: "Beta", blurb: "", lessons: ["b1", "b2"] },
      { id: "P", name: "Projet", blurb: "", lessons: ["p1"], project: true },
    ],
  };
  const statuses = (p: ReturnType<typeof trackPath>) => Object.fromEntries(p.chapters.flatMap((c) => c.steps).map((s) => [s.id, s.status]));

  it("opens one lesson at a time and marks exactly one current step", () => {
    const p = trackPath(track, knowledgeFrom(["a1"], {}), get);
    expect(statuses(p)).toMatchObject({ a1: "completed", a2: "current", A: "locked", b1: "locked", p1: "locked" });
    expect(p.current?.id).toBe("a2");
    expect(p.chapters.map((c) => c.status)).toEqual(["current", "locked", "locked"]);
    expect(p.chapters[1].lockedBy).toBe("Alpha");
  });

  it("a validated chapter counts as known and opens the next one; its review opens too", () => {
    const p = trackPath(track, knowledgeFrom([], { bird: { score: 6, chapters: ["A"], at: "" } }), get);
    expect(statuses(p)).toMatchObject({ a1: "covered", a2: "covered", A: "available", b1: "current", b2: "locked" });
    expect(p.chapters[0]).toMatchObject({ status: "done", validatedByTest: true });
    expect(p.done).toBe(2);
  });

  it("a validated later chapter stays known while the gap before it is played", () => {
    const p = trackPath(track, knowledgeFrom([], { bird: { score: 6, chapters: ["B"], at: "" } }), get);
    expect(statuses(p)).toMatchObject({ a1: "current", b1: "covered", b2: "covered", p1: "locked" });
  });

  it("free mode opens everything, and a finished path has no current step", () => {
    expect(statuses(trackPath(track, knowledgeFrom([], {}, { free: true }), get))).toMatchObject({ a1: "current", b2: "available", p1: "available" });
    const done = trackPath(track, knowledgeFrom(["a1", "a2", "b1", "b2", "p1"], {}), get);
    expect(done.finished).toBe(true);
    expect(done.current).toBeUndefined();
  });

  it("lessons of another track are open access", () => {
    expect(canOpenLesson("b2", "fox", track, knowledgeFrom([], {}), get).ok).toBe(true);
    expect(canOpenLesson("b2", "bird", track, knowledgeFrom([], {}), get).ok).toBe(false);
    expect(canOpenLesson("a1", "bird", track, knowledgeFrom([], {}), get).ok).toBe(true);
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
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ mode: "free", sessionMinutes: 7, dailyGoal: 50, sounds: false, motion: "calm", textSize: "huge", placements: { bird: 1 } })).toEqual({
      mode: "free", sessionMinutes: 5, dailyGoal: 50, sounds: false, motion: "calm", textSize: "normal",
    });
  });

  it("reads placements from the signup copy and the stored ones, keeping only valid chapters", () => {
    const p = readPlacements(
      { goal: "build", placement: { track: "fox", score: 7, chapters: ["f1", "f2", "g1", "f7"], at: "2026-10-01T00:00:00Z" } },
      { placements: { gecko: { score: 11, chapters: ["g1"], at: "x" }, bogus: { score: 3 }, bird: { score: "9" } } },
    );
    expect(p.fox).toEqual({ score: 7, chapters: ["f1", "f2"], at: "2026-10-01T00:00:00Z" });
    expect(p.gecko).toMatchObject({ score: 10, chapters: ["g1"] });
    expect(p.bird).toBeUndefined();
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
