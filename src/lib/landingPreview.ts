import { LESSONS } from "@/content";
import { INTERVAL_DAYS } from "./srs";
import { getPlacementQuestion, levelName } from "./placement";

/** The real content behind the "Comment ça marche" previews, so the landing shows what the product really shows. */
export type LandingPreviews = {
  /** An annotated brief from a real prompt lesson: only the short, self-contained parts. */
  brief: { lessonTitle: string; parts: { label: string; text: string; detail: string }[] } | null;
  /** A real question and its real explanation. */
  quiz: { statement: string; explanation: string } | null;
  /** The example result shown in step 1, labelled with the real level names. */
  exampleLevel: { level10: number; label: string };
  /** Days since a miss at which the question comes back, given right answers each time (Leitner boxes 1 to 4). */
  reviewDays: number[];
};

const BRIEF_LABELS = ["Tâche", "Critère de réussite", "Format"];

export function buildPreviews(): LandingPreviews {
  let brief: LandingPreviews["brief"] = null;
  for (const lesson of LESSONS) {
    for (const section of lesson.sections) {
      for (const block of section.blocks) {
        if (block.type !== "anatomy" || brief) continue;
        const parts = BRIEF_LABELS.map((label) => block.segments.find((s) => s.label === label)).filter((s): s is NonNullable<typeof s> => Boolean(s?.label && s.detail));
        if (parts.length === BRIEF_LABELS.length) brief = { lessonTitle: lesson.title, parts: parts.map((s) => ({ label: s.label!, text: s.text.trim(), detail: s.detail! })) };
      }
    }
  }

  const q = getPlacementQuestion("p1b");
  const quiz = q && q.type === "true_false" ? { statement: q.statement, explanation: q.explanation } : null;

  let total = 0;
  const reviewDays = [1, 2, 3, 4].map((box) => (total += INTERVAL_DAYS[box]));
  const level10 = 6;
  return { brief, quiz, exampleLevel: { level10, label: levelName(level10) }, reviewDays };
}
