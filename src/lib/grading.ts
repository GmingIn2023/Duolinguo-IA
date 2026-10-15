import type { Answer, Question } from "@/content/types";

const sameSequence = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const sameSet = (a: string[], b: string[]) => a.length === b.length && new Set(a).size === a.length && a.every((v) => b.includes(v));
const isStringArray = (v: Answer): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Lowercase, accents removed, punctuation collapsed: written answers are matched on ideas, not spelling. */
export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type Written = Extract<Question, { type: "written" }>;

/** Ids of the criteria a written answer meets. */
export function metCriteria(q: Written, text: string): string[] {
  const t = normalizeText(text);
  return q.criteria.filter((c) => c.anyOf.some((frag) => t.includes(normalizeText(frag)))).map((c) => c.id);
}

export const WRITTEN_MAX = 1200;

export function gradeAnswer(q: Question, answer: Answer): boolean {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
      return typeof answer === "string" && answer === q.answer;
    case "true_false":
      return typeof answer === "boolean" && answer === q.answer;
    case "ordering":
    case "ranking":
    case "match":
      return isStringArray(answer) && sameSequence(answer, q.answer);
    case "ai_analysis":
    case "multi":
      return isStringArray(answer) && sameSet(answer, q.answer);
    case "written":
      return typeof answer === "string" && answer.length <= WRITTEN_MAX && metCriteria(q, answer).length >= q.minCriteria;
  }
}
