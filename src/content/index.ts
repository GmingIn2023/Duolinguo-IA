import type { Lesson, Question, Track, TrackId } from "./types";
import { foundations } from "./lessons/foundations";
import { studentLessons } from "./lessons/students";
import { workLessons } from "./lessons/work";
import { typesetContent } from "../lib/typo";

export const LESSONS: Lesson[] = typesetContent([...foundations, ...studentLessons, ...workLessons]);
const byId = new Map(LESSONS.map((l) => [l.id, l]));

export const TRACKS: Record<TrackId, Track> = typesetContent({
  bird: {
    id: "bird",
    animal: "Bird",
    name: "Premiers pas",
    audience: "Débutant complet",
    pitch: "Comprendre ce qu'est l'IA, l'utiliser sans crainte, protéger tes données.",
    lessonIds: ["ia-cest-quoi", "comment-ecrit-un-chatbot", "hallucinations", "premier-prompt", "vie-privee", "panorama-outils"],
  },
  gecko: {
    id: "gecko",
    animal: "Gecko",
    name: "Apprendre avec l'IA",
    audience: "Lycéen · étudiant",
    pitch: "Faire de l'IA un tuteur : comprendre, vérifier ses sources, réviser mieux.",
    lessonIds: [
      "ia-cest-quoi",
      "comment-ecrit-un-chatbot",
      "hallucinations",
      "tuteur-pas-copieur",
      "verifier-sources",
      "vie-privee",
      "reviser-avec-ia",
      "panorama-outils",
    ],
  },
  fox: {
    id: "fox",
    animal: "Fox",
    name: "L'IA au travail",
    audience: "Professionnels",
    pitch: "Briefer l'IA, protéger les données de l'entreprise, relire comme un pro.",
    lessonIds: [
      "comment-ecrit-un-chatbot",
      "hallucinations",
      "prompt-de-travail",
      "donnees-confidentielles",
      "rediger-resumer",
      "relire-ia",
      "panorama-outils",
    ],
  },
});

export const TRACK_IDS = Object.keys(TRACKS) as TrackId[];

export const getLesson = (id: string) => byId.get(id);

export const isTrackId = (v: unknown): v is TrackId => typeof v === "string" && v in TRACKS;

/**
 * A track's lessons in order. Within a track the path is linear: each lesson unlocks the next.
 * The lesson's declared `prerequisites` are shown to the learner as "à connaître avant".
 */
export function trackLessons(trackId: TrackId): Lesson[] {
  const ids = TRACKS[trackId].lessonIds;
  return ids.map((id, i) => ({ ...byId.get(id)!, prerequisites: i === 0 ? [] : [ids[i - 1]] }));
}

const questionIndex = new Map<string, { question: Question; lesson: Lesson }>(
  LESSONS.flatMap((lesson) => lesson.questions.map((question) => [question.id, { question, lesson }] as const)),
);

export const getQuestion = (id: string) => questionIndex.get(id);
