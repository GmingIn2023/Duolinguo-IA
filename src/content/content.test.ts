import { describe, expect, it } from "vitest";
import { LESSONS, TRACKS, getLesson } from ".";
import { TOOLS } from "./tools";
import type { Question } from "./types";

const answerIdsValid = (q: Question) => {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
      return q.options.some((o) => o.id === q.answer);
    case "true_false":
      return true;
    case "ranking":
    case "ordering":
      return q.answer.length === q.items.length && q.items.every((i) => q.answer.includes(i.id));
    case "ai_analysis":
      return q.answer.length > 0 && q.answer.every((a) => q.options.some((o) => o.id === a));
  }
};

describe("content integrity", () => {
  it("every track references existing lessons with non-decreasing difficulty", () => {
    for (const track of Object.values(TRACKS)) {
      const levels = track.lessonIds.map((id) => {
        const lesson = getLesson(id);
        expect(lesson, `${track.id} → ${id}`).toBeDefined();
        return lesson!.level;
      });
      expect(levels).toEqual([...levels].sort());
    }
  });

  it("declared prerequisites come earlier in every track that contains the lesson", () => {
    for (const track of Object.values(TRACKS)) {
      track.lessonIds.forEach((id, i) => {
        for (const pre of getLesson(id)!.prerequisites) {
          const at = track.lessonIds.indexOf(pre);
          if (at !== -1) expect(at, `${track.id}: ${pre} before ${id}`).toBeLessThan(i);
        }
      });
    }
  });

  it("each lesson is complete: objective, illustration, skills, at least 5 questions", () => {
    for (const l of LESSONS) {
      expect(l.objective.length).toBeGreaterThan(10);
      expect(l.skills.length).toBeGreaterThan(0);
      expect(l.blocks.some((b) => b.type === "illustration"), l.id).toBe(true);
      expect(l.questions.length, l.id).toBeGreaterThanOrEqual(5);
    }
  });

  it("question ids are unique, prefixed by lesson, and answers point to real options", () => {
    const seen = new Set<string>();
    for (const l of LESSONS) {
      for (const q of l.questions) {
        expect(seen.has(q.id), q.id).toBe(false);
        seen.add(q.id);
        expect(q.id.startsWith(`${l.id}:`)).toBe(true);
        expect(answerIdsValid(q), q.id).toBe(true);
        if (q.type === "fill_choice") expect(q.sentence.split("___").length, q.id).toBe(2);
      }
    }
  });

  it("covers every question type", () => {
    const types = new Set(LESSONS.flatMap((l) => l.questions.map((q) => q.type)));
    expect([...types].sort()).toEqual(["ai_analysis", "fill_choice", "mcq", "ordering", "ranking", "true_false"]);
  });

  it("tool references resolve and tool-dependent lessons are flagged volatile", () => {
    for (const l of LESSONS) {
      const referenced = l.blocks.flatMap((b) => (b.type === "tools" ? b.toolIds : []));
      for (const t of referenced) {
        expect(TOOLS[t]).toBeDefined();
        expect(l.volatile?.toolIds, l.id).toContain(t);
      }
    }
  });
});
