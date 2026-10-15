import { describe, expect, it } from "vitest";
import { LESSONS, TRACKS, TRACK_IDS, getLesson, getQuestion, reviewVariant } from ".";
import { THEME_IDS } from "./curriculum";
import { TOOLS } from "./tools";
import type { Block, Lesson, Question } from "./types";
import { PLACEMENT_POOL } from "@/lib/placement";

/** Problems with a question's shape; empty when it is coherent. */
function questionProblems(q: Question): string[] {
  const p: string[] = [];
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  switch (q.type) {
    case "mcq":
    case "fill_choice":
      if (!q.options.some((o) => o.id === q.answer)) p.push("answer not among options");
      if (!unique(q.options.map((o) => o.id))) p.push("duplicate option ids");
      if (q.options.length < 2) p.push("fewer than 2 options");
      if (q.type === "fill_choice" && q.sentence.split("___").length !== 2) p.push("sentence needs exactly one ___");
      break;
    case "true_false":
      if (typeof q.answer !== "boolean") p.push("answer not boolean");
      break;
    case "ranking":
    case "ordering":
      if (q.answer.length !== q.items.length || !q.items.every((i) => q.answer.includes(i.id))) p.push("answer is not a permutation of items");
      if (!unique(q.items.map((i) => i.id))) p.push("duplicate item ids");
      break;
    case "ai_analysis":
    case "multi":
      if (!q.answer.length || !q.answer.every((a) => q.options.some((o) => o.id === a))) p.push("answer ids not among options");
      if (!unique(q.answer) || !unique(q.options.map((o) => o.id))) p.push("duplicate ids");
      break;
    case "match":
      if (q.answer.length !== q.left.length) p.push("one answer per left item");
      if (!q.answer.every((a) => q.right.some((r) => r.id === a))) p.push("answer ids not among right items");
      if (!unique(q.left.map((i) => i.id)) || !unique(q.right.map((i) => i.id))) p.push("duplicate ids");
      break;
    case "written":
      if (q.minCriteria < 1 || q.minCriteria > q.criteria.length) p.push("minCriteria out of range");
      if (q.criteria.some((c) => !c.anyOf.length || c.anyOf.some((f) => f.trim().length < 3))) p.push("criterion fragments too short");
      if (!q.modelAnswer.trim()) p.push("missing model answer");
      break;
  }
  if (!q.explanation.trim()) p.push("missing explanation");
  return p;
}

const checkBlocks = (l: Lesson) => l.sections.flatMap((s) => s.blocks.filter((b): b is Extract<Block, { type: "check" }> => b.type === "check").map((b) => b.question));
const allQuestions = (l: Lesson) => [...l.questions, ...l.reviewQuestions, ...checkBlocks(l)];

describe("curriculum", () => {
  it("has unique lesson ids and covers every theme", () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const t of THEME_IDS) expect(LESSONS.some((l) => l.theme === t), t).toBe(true);
  });

  it("every track node points to an existing lesson, and nodes have unique ids and positions", () => {
    for (const id of TRACK_IDS) {
      const t = TRACKS[id];
      expect(new Set(t.nodes.map((n) => n.id)).size, id).toBe(t.nodes.length);
      expect(new Set(t.nodes.map((n) => `${n.col}:${n.lane}`)).size, `${id} overlapping nodes`).toBe(t.nodes.length);
      for (const n of t.nodes) {
        if (n.lessonId) expect(getLesson(n.lessonId), `${id} → ${n.lessonId}`).toBeDefined();
        for (const c of n.covers ?? []) expect(t.nodes.some((m) => m.lessonId === c), `${id}: ${n.id} covers ${c}`).toBe(true);
        expect(t.units.some((u) => u.id === n.unit), `${id}: unit ${n.unit}`).toBe(true);
      }
    }
  });

  it("every track is closed under prerequisites, and a prerequisite sits in an earlier column", () => {
    for (const id of TRACK_IDS) {
      const nodes = TRACKS[id].nodes;
      for (const n of nodes.filter((x) => x.lessonId)) {
        for (const pre of getLesson(n.lessonId!)!.prerequisites) {
          const at = nodes.find((m) => m.lessonId === pre);
          expect(at, `${id}: ${n.lessonId} needs ${pre}`).toBeDefined();
          expect(at!.col, `${id}: ${pre} before ${n.lessonId}`).toBeLessThan(n.col);
        }
      }
    }
  });

  it("prerequisites exist and form no cycle", () => {
    const state = new Map<string, "visiting" | "done">();
    const visit = (id: string, path: string[]) => {
      expect(state.get(id), `cycle: ${[...path, id].join(" → ")}`).not.toBe("visiting");
      if (state.get(id) === "done") return;
      state.set(id, "visiting");
      for (const pre of getLesson(id)!.prerequisites) {
        expect(getLesson(pre), `${id} needs unknown ${pre}`).toBeDefined();
        visit(pre, [...path, id]);
      }
      state.set(id, "done");
    };
    for (const l of LESSONS) visit(l.id, []);
  });
});

describe("lessons", () => {
  it.each(LESSONS.map((l) => [l.id, l] as const))("%s is complete", (_, l) => {
    expect(l.objective.length).toBeGreaterThan(15);
    expect(l.skills.length).toBeGreaterThan(0);
    expect(l.sections.length).toBeGreaterThanOrEqual(2);
    expect(new Set(l.sections.map((s) => s.id)).size).toBe(l.sections.length);
    for (const s of l.sections) expect(s.blocks.length, `${l.id}/${s.id}`).toBeGreaterThan(0);
    expect(l.summary.length).toBeGreaterThanOrEqual(3);
    expect(l.summary.length).toBeLessThanOrEqual(6);
    expect(l.questions.length).toBeGreaterThanOrEqual(5);
    expect(l.reviewQuestions.length).toBeGreaterThanOrEqual(1);
    expect(l.durationMin).toBeGreaterThan(0);
    expect(l.sources.length).toBeGreaterThan(0);
    for (const s of l.sources) {
      expect(s.url, l.id).toMatch(/^https:\/\//);
      expect(s.verified, l.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    // a course is not a wall of text
    const types = new Set(l.sections.flatMap((s) => s.blocks.map((b) => b.type)));
    expect(types.size, `${l.id}: block variety`).toBeGreaterThanOrEqual(4);
  });

  it.each(LESSONS.map((l) => [l.id, l] as const))("%s has coherent questions", (_, l) => {
    for (const q of allQuestions(l)) expect(questionProblems(q), `${l.id}/${q.id}`).toEqual([]);
    for (const b of l.sections.flatMap((s) => s.blocks)) {
      if (b.type === "tools") for (const t of b.toolIds) expect(t in TOOLS, `${l.id}: tool ${t}`).toBe(true);
      if (b.type === "spectrum") for (const i of b.items) expect(i.position >= 0 && i.position <= 100, `${l.id}: spectrum`).toBe(true);
    }
  });

  it("question ids are unique across the whole curriculum and the placement test", () => {
    const ids = [...LESSONS.flatMap((l) => allQuestions(l).map((q) => q.id)), ...PLACEMENT_POOL.map((q) => q.id)];
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("review questions share a concept with a quiz question, so notions come back in another form", () => {
    for (const l of LESSONS) {
      const quizConcepts = new Set(l.questions.map((q) => q.concept).filter(Boolean));
      for (const r of l.reviewQuestions) expect(r.concept && quizConcepts.has(r.concept), `${l.id}/${r.id} concept ${r.concept}`).toBe(true);
    }
  });

  it("a review variant comes back under another form from the second review on", () => {
    const l = LESSONS.find((x) => x.reviewQuestions.length)!;
    const base = l.questions.find((q) => q.concept === l.reviewQuestions[0].concept)!;
    expect(reviewVariant(base.id, 1)?.id).toBe(base.id);
    expect(reviewVariant(base.id, 2)?.id).not.toBe(base.id);
    expect(getQuestion(l.reviewQuestions[0].id)?.pool).toBe("review");
  });
});
