import { getLesson } from "@/content";
import { INTERVAL_DAYS } from "./srs";
import { getPlacementQuestion } from "./placement";

/** The real content behind the "Comment ça marche" previews, so the landing shows what the product really shows. */
export type LandingPreviews = {
  /** A short lesson screen: one paragraph (with its bold words) and the quick question that follows it. */
  excerpt: { lessonTitle: string; body: string; statement: string; answer: boolean; why: string };
  /** A real true/false question and its explanation, split around the words worth highlighting. */
  quiz: { statement: string; answer: boolean; before: string; mark: string; after: string } | null;
  /** The example result of step 1: a score, the chapters it validated, where the learner starts. */
  example: { score: number; trackName: string; validated: string[]; start: string };
  /** Days since a miss at which the question comes back, given right answers each time (Leitner boxes 1 to 4). */
  reviewDays: number[];
};

const MARK = "ne dit rien de l'exactitude";

export function buildPreviews(): LandingPreviews {
  const lesson = getLesson("hallucinations");
  const excerpt = {
    lessonTitle: lesson?.title ?? "Quand l'IA invente",
    body: "Une IA ne cherche pas la réponse dans une liste de faits. Elle **prédit les mots les plus probables**. Quand elle ne sait pas, elle peut **inventer une réponse** qui sonne juste. On appelle ça une **hallucination**.",
    statement: "Une réponse dite avec assurance est forcément juste.",
    answer: false,
    why: "Le ton sûr de lui ne prouve rien : vérifie les faits importants.",
  };

  const q = getPlacementQuestion("c-assurance");
  let quiz: LandingPreviews["quiz"] = null;
  if (q && q.type === "true_false") {
    const at = q.explanation.indexOf(MARK);
    quiz =
      at === -1
        ? { statement: q.statement, answer: q.answer, before: q.explanation, mark: "", after: "" }
        : { statement: q.statement, answer: q.answer, before: q.explanation.slice(0, at), mark: MARK, after: q.explanation.slice(at + MARK.length) };
  }

  let total = 0;
  const reviewDays = [1, 2, 3, 4].map((box) => (total += INTERVAL_DAYS[box]));
  return {
    excerpt,
    quiz,
    example: { score: 7, trackName: "Pratiquer", validated: ["Le bon brief", "Étudier"], start: "Écrire et résumer" },
    reviewDays,
  };
}
