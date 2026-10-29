import { describe, expect, it } from "vitest";
import { LESSONS, TRACKS, TRACK_IDS, getLesson, getQuestion, lessonPlace, reviewVariant, trackLessons } from ".";
import { THEME_IDS } from "./curriculum";
import { TOOLS } from "./tools";
import type { Block, Lesson, Question } from "./types";
import { CHAPTER_POOL, COMMON_POOL, getPlacementQuestion, testedChapters } from "@/lib/placement";

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
    case "sort":
      if (q.answer.length !== q.items.length) p.push("one bin per item");
      if (!q.answer.includes(0) || !q.answer.includes(1)) p.push("both bins must be used");
      if (!unique(q.items.map((i) => i.id))) p.push("duplicate item ids");
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

  it("every lesson belongs to exactly one track, and every chapter lesson exists", () => {
    const seen = new Map<string, string>();
    for (const id of TRACK_IDS) {
      for (const c of TRACKS[id].chapters) {
        expect(c.lessons.length, `${id}/${c.id} is empty`).toBeGreaterThan(0);
        expect(c.blurb.length, `${id}/${c.id} blurb too long`).toBeLessThanOrEqual(60);
        for (const l of c.lessons) {
          expect(getLesson(l), `${id}/${c.id} → ${l}`).toBeDefined();
          expect(seen.get(l), `${l} is in ${seen.get(l)} and ${id}`).toBeUndefined();
          seen.set(l, id);
        }
      }
    }
    expect([...seen.keys()].sort()).toEqual(LESSONS.map((l) => l.id).sort());
  });

  it("chapter ids are unique, and each track ends with its project", () => {
    const ids = TRACK_IDS.flatMap((id) => TRACKS[id].chapters.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of TRACK_IDS) {
      const chapters = TRACKS[id].chapters;
      expect(chapters.at(-1)?.project, `${id} ends with a project`).toBe(true);
      expect(chapters.filter((c) => c.project).length, id).toBe(1);
    }
  });

  it("every tested chapter has two placement forms", () => {
    for (const id of TRACK_IDS) {
      for (const c of testedChapters(id)) expect(CHAPTER_POOL.filter((q) => q.chapter === c).length, c).toBe(2);
    }
    for (const q of CHAPTER_POOL) expect(TRACK_IDS.some((id) => testedChapters(id).includes(q.chapter!)), `${q.id} → ${q.chapter}`).toBe(true);
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
    expect(l.questions.length).toBeGreaterThanOrEqual(4);
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
    const ids = [...LESSONS.flatMap((l) => allQuestions(l).map((q) => q.id)), ...COMMON_POOL.map((q) => q.id), ...CHAPTER_POOL.map((q) => q.id), "c-deux"];
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

describe("placement questions", () => {
  it("are coherent", () => {
    for (const q of [...COMMON_POOL, ...CHAPTER_POOL, getPlacementQuestion("c-deux")!]) expect(questionProblems(q), q.id).toEqual([]);
  });
  it("never ask the learner to write", () => {
    for (const q of [...COMMON_POOL, ...CHAPTER_POOL]) expect(q.type, q.id).not.toBe("written");
  });
});

/**
 * Each track has a strict lesson format: short pages, few paragraphs, interaction early and often.
 * "Prose" counts paragraphs: a text, a definition or a mistake is one, a keypoint is half.
 */
const TEMPLATE = {
  bird: { minutes: [3, 5], projectMinutes: 8, sections: [4, 6], prose: 1, words: 45, quiz: [4, 4], interactiveShare: 0.75, written: false },
  gecko: { minutes: [4, 8], projectMinutes: 20, sections: [5, 8], prose: 2, words: 60, quiz: [5, 5], interactiveShare: 0.5, written: true },
  fox: { minutes: [8, 15], projectMinutes: 45, sections: [6, 12], prose: 3, words: 90, quiz: [6, 8], interactiveShare: 0.3, written: true },
} as const;
const INTERACTIVE = new Set(["check", "flow", "layers", "anatomy", "spectrum"]);
const PROSE: Partial<Record<string, number>> = { text: 1, definition: 1, mistake: 1, keypoint: 0.5 };
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const proseText = (b: Block) => (b.type === "text" || b.type === "definition" || b.type === "keypoint" ? b.body : b.type === "mistake" ? `${b.why} ${b.fix}` : "");

describe("lesson templates", () => {
  const lessons = TRACK_IDS.flatMap((track) => trackLessons(track).map((l) => [l.id, track, l] as const));
  it.each(lessons)("%s follows the %s format", (_, track, l) => {
    const t = TEMPLATE[track];
    const project = lessonPlace(l.id)?.chapter.project;
    expect(l.durationMin, "duration").toBeGreaterThanOrEqual(t.minutes[0]);
    expect(l.durationMin, "duration").toBeLessThanOrEqual(project ? t.projectMinutes : t.minutes[1]);
    expect(l.sections.length, "sections").toBeGreaterThanOrEqual(t.sections[0]);
    expect(l.sections.length, "sections").toBeLessThanOrEqual(t.sections[1]);
    expect(l.questions.length, "quiz").toBeGreaterThanOrEqual(t.quiz[0]);
    expect(l.questions.length, "quiz").toBeLessThanOrEqual(t.quiz[1]);
    for (const s of l.sections) {
      const prose = s.blocks.reduce((n, b) => n + (PROSE[b.type] ?? 0), 0);
      expect(prose, `${s.id}: paragraphs`).toBeLessThanOrEqual(t.prose);
      for (const b of s.blocks) expect(words(proseText(b)), `${s.id}: paragraph length`).toBeLessThanOrEqual(t.words);
    }
    const interactive = l.sections.filter((s) => s.blocks.some((b) => INTERACTIVE.has(b.type))).length;
    expect(interactive / l.sections.length, "interactive share").toBeGreaterThanOrEqual(t.interactiveShare);
    if (!t.written) for (const q of allQuestions(l)) expect(q.type, `${q.id}: no writing in ${track}`).not.toBe("written");
    expect(l.summary.length, "summary").toBeLessThanOrEqual(track === "bird" ? 3 : track === "gecko" ? 5 : 6);
  });
});
