import { getQuestion, reviewVariant } from "@/content";
import type { Question } from "@/content/types";
import { isGraded } from "./grading";

/** A scheduled notion and the question shown for it in this session. */
export type Served = { scheduledId: string; lessonId: string; question: Question };
export type Target = { questionId: string; lessonId: string };

/**
 * Turns scheduled items into the questions to show, a notion coming back under another form when one exists.
 * Two quiz questions can share a concept, and so the same review form: the second one is then shown as itself,
 * so every scheduled notion is served by exactly one question and none is silently dropped.
 */
export function serveItems(items: { question_id: string; box: number }[]): Served[] {
  const seen = new Set<string>();
  const scheduled = new Set<string>();
  return items.flatMap((i) => {
    const found = getQuestion(i.question_id);
    if (!found || !isGraded(found.question) || scheduled.has(i.question_id)) return [];
    const variant = reviewVariant(i.question_id, i.box);
    const question = variant && !seen.has(variant.id) ? variant : found.question;
    if (seen.has(question.id)) return [];
    seen.add(question.id);
    scheduled.add(i.question_id);
    return [{ scheduledId: i.question_id, lessonId: found.lesson.id, question }];
  });
}

/** Served question id → the scheduled notion it stands for, exactly as the session was built. */
export function targetsOf(served: Served[]): Map<string, Target> {
  return new Map(served.map((s) => [s.question.id, { questionId: s.scheduledId, lessonId: s.lessonId }]));
}

/**
 * For questions served outside the schedule (chapter reviews): a quiz question stands for itself, a review form
 * for the first quiz question of the same concept.
 */
export function notionOf(servedId: string): Target | null {
  const found = getQuestion(servedId);
  if (!found) return null;
  const { question, lesson, pool } = found;
  if (pool === "quiz") return { questionId: servedId, lessonId: lesson.id };
  const base = question.concept ? lesson.questions.find((q) => q.concept === question.concept) : undefined;
  return { questionId: (base ?? question).id, lessonId: lesson.id };
}

export function targetsOfQuestions(questions: Question[]): Map<string, Target> {
  return new Map(questions.flatMap((q) => {
    const t = notionOf(q.id);
    return t ? [[q.id, t] as const] : [];
  }));
}

/** A chapter review's questions: two or three per lesson, review forms first so notions come back differently. */
export function checkpointQuestions(lessonIds: string[], getLesson: (id: string) => { questions: Question[]; reviewQuestions: Question[] } | undefined): Question[] {
  const per = lessonIds.length <= 2 ? 3 : 2;
  return lessonIds.flatMap((id) => {
    const l = getLesson(id);
    return l ? [...l.reviewQuestions, ...l.questions].filter(isGraded).slice(0, per) : [];
  });
}
