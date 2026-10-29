import type { Chapter, Lesson, Question, ThemeId, TrackId } from "./types";
import { THEMES, THEME_IDS, TRACKS as RAW_TRACKS, TRACK_IDS, DIFFICULTY_LABEL, isThemeId, isTrackId } from "./curriculum";
import { birdChapter1 } from "./lessons/bird/b1";
import { birdChapter2 } from "./lessons/bird/b2";
import { birdChapter3 } from "./lessons/bird/b3";
import { birdChapter4 } from "./lessons/bird/b4";
import { birdChapter5 } from "./lessons/bird/b5";
import { birdChapter6 } from "./lessons/bird/b6";
import { geckoChapter1 } from "./lessons/gecko/g1";
import { geckoChapter2 } from "./lessons/gecko/g2";
import { geckoChapter3 } from "./lessons/gecko/g3";
import { geckoChapter4 } from "./lessons/gecko/g4";
import { geckoChapter5 } from "./lessons/gecko/g5";
import { geckoChapter6 } from "./lessons/gecko/g6";
import { foxTokens } from "./lessons/fox/tokens";
import { foxChapter1 } from "./lessons/fox/f1";
import { foxChapter2 } from "./lessons/fox/f2";
import { foxChapter3 } from "./lessons/fox/f3";
import { foxChapter4 } from "./lessons/fox/f4";
import { foxOrchestrer } from "./lessons/fox/orchestrer";
import { foxChapter5 } from "./lessons/fox/f5";
import { foxEvaluerRag } from "./lessons/fox/evaluer-un-rag";
import { foxChapter6 } from "./lessons/fox/f6";
import { foxChapter7 } from "./lessons/fox/f7";
import { typesetContent } from "../lib/typo";

export { THEMES, THEME_IDS, TRACK_IDS, DIFFICULTY_LABEL, isThemeId, isTrackId };

export const LESSONS: Lesson[] = typesetContent([
  ...birdChapter1,
  ...birdChapter2,
  ...birdChapter3,
  ...birdChapter4,
  ...birdChapter5,
  ...birdChapter6,
  ...geckoChapter1,
  ...geckoChapter2,
  ...geckoChapter3,
  ...geckoChapter4,
  ...geckoChapter5,
  ...geckoChapter6,
  ...foxTokens,
  ...foxChapter1,
  ...foxChapter2,
  ...foxChapter3,
  ...foxChapter4,
  ...foxOrchestrer,
  ...foxChapter5,
  ...foxEvaluerRag,
  ...foxChapter6,
  ...foxChapter7,
]);

const byId = new Map(LESSONS.map((l) => [l.id, l]));
export const getLesson = (id: string) => byId.get(id);

export const TRACKS = typesetContent(RAW_TRACKS);

/** Where a lesson sits: its track, its chapter, and its position in the chapter. */
export type LessonPlace = { track: TrackId; chapter: Chapter; chapterIndex: number; index: number };

const places = new Map<string, LessonPlace>();
for (const track of TRACK_IDS) {
  TRACKS[track].chapters.forEach((chapter, chapterIndex) => {
    chapter.lessons.forEach((id, index) => places.set(id, { track, chapter, chapterIndex, index }));
  });
}
export const lessonPlace = (id: string) => places.get(id);

/** The lessons of a track, in path order. */
export function trackLessons(trackId: TrackId): Lesson[] {
  return TRACKS[trackId].chapters.flatMap((c) => c.lessons.map((id) => byId.get(id)!).filter(Boolean));
}

/** A chapter anywhere in the curriculum, by id. */
export function findChapter(id: string): { chapter: Chapter; track: TrackId; index: number } | undefined {
  for (const track of TRACK_IDS) {
    const index = TRACKS[track].chapters.findIndex((c) => c.id === id);
    if (index !== -1) return { chapter: TRACKS[track].chapters[index], track, index };
  }
}

export const lessonsByTheme = (theme: ThemeId) => LESSONS.filter((l) => l.theme === theme);

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
