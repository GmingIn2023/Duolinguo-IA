import type { Lesson, MapNode, Question, ThemeId, TrackId } from "./types";
import { comprendreLessons } from "./lessons/comprendre";
import { promptLessons } from "./lessons/prompt";
import { confianceLessons } from "./lessons/confiance";
import { outilsLessons } from "./lessons/outils";
import { workflowsLessons } from "./lessons/workflows";
import { agentsLessons } from "./lessons/agents";
import { devLessons } from "./lessons/dev";
import { apiLessons } from "./lessons/api";
import { ragLessons } from "./lessons/rag";
import { projetsLessons } from "./lessons/projets";
import { THEMES, THEME_IDS, TRACKS as RAW_TRACKS, TRACK_IDS, DIFFICULTY_LABEL, isThemeId, isTrackId } from "./curriculum";
import { typesetContent } from "../lib/typo";

export { THEMES, THEME_IDS, TRACK_IDS, DIFFICULTY_LABEL, isThemeId, isTrackId };

export const LESSONS: Lesson[] = typesetContent([
  ...comprendreLessons,
  ...promptLessons,
  ...confianceLessons,
  ...outilsLessons,
  ...workflowsLessons,
  ...agentsLessons,
  ...devLessons,
  ...apiLessons,
  ...ragLessons,
  ...projetsLessons,
]);

const byId = new Map(LESSONS.map((l) => [l.id, l]));
export const getLesson = (id: string) => byId.get(id);

export const TRACKS = typesetContent(RAW_TRACKS);

/** The lessons of a track, in board order (column, then lane). */
export function trackLessons(trackId: TrackId): Lesson[] {
  return TRACKS[trackId].nodes
    .filter((n) => n.lessonId)
    .sort((a, b) => a.col - b.col || a.lane - b.lane)
    .map((n) => byId.get(n.lessonId!)!)
    .filter(Boolean);
}

export const getNode = (trackId: TrackId, nodeId: string): MapNode | undefined => TRACKS[trackId].nodes.find((n) => n.id === nodeId);

/** A checkpoint anywhere in the curriculum, by id. */
export function findCheckpoint(id: string): { node: MapNode; track: TrackId } | undefined {
  for (const track of TRACK_IDS) {
    const node = TRACKS[track].nodes.find((n) => n.kind === "checkpoint" && n.id === id);
    if (node) return { node, track };
  }
}

export const lessonsByTheme = (theme: ThemeId) => LESSONS.filter((l) => l.theme === theme);

/** Every prerequisite of a lesson, transitively, in learning order (deepest first). */
export function prerequisiteChain(lessonId: string): Lesson[] {
  const seen = new Set<string>();
  const out: Lesson[] = [];
  const visit = (id: string) => {
    const l = byId.get(id);
    if (!l || seen.has(id)) return;
    seen.add(id);
    l.prerequisites.forEach(visit);
    out.push(l);
  };
  byId.get(lessonId)?.prerequisites.forEach(visit);
  return out;
}

type Indexed = { question: Question; lesson: Lesson; pool: "quiz" | "review" | "check" };

const checkQuestions = (l: Lesson) =>
  l.sections.flatMap((s) => s.blocks.flatMap((b) => (b.type === "check" ? [b.question] : [])));

const questionIndex = new Map<string, Indexed>(
  LESSONS.flatMap((lesson) => [
    ...lesson.questions.map((question) => [question.id, { question, lesson, pool: "quiz" }] as const),
    ...lesson.reviewQuestions.map((question) => [question.id, { question, lesson, pool: "review" }] as const),
    ...checkQuestions(lesson).map((question) => [question.id, { question, lesson, pool: "check" }] as const),
  ]),
);

export const getQuestion = (id: string) => questionIndex.get(id);

/**
 * The question to show when a scheduled item comes back. From the second review on, a notion
 * returns under another form when the lesson has one: same concept, different question.
 */
export function reviewVariant(scheduledId: string, box: number): Question | undefined {
  const found = questionIndex.get(scheduledId);
  if (!found) return undefined;
  const { question, lesson } = found;
  if (!question.concept) return question;
  const forms = [question, ...lesson.reviewQuestions.filter((q) => q.concept === question.concept)];
  return forms[Math.max(0, box - 1) % forms.length];
}
