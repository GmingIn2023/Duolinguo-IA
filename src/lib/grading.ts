import type { Answer, Question } from "@/content/types";

const sameSequence = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const sameSet = (a: string[], b: string[]) => a.length === b.length && new Set(a).size === a.length && a.every((v) => b.includes(v));
const isStringArray = (v: Answer): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

export function gradeAnswer(q: Question, answer: Answer): boolean {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
      return typeof answer === "string" && answer === q.answer;
    case "true_false":
      return typeof answer === "boolean" && answer === q.answer;
    case "ordering":
    case "ranking":
      return isStringArray(answer) && sameSequence(answer, q.answer);
    case "ai_analysis":
      return isStringArray(answer) && sameSet(answer, q.answer);
  }
}
