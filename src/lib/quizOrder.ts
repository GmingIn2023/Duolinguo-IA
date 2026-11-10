import type { Answer, Question } from "@/content/types";
import { seededShuffle, shuffleAway } from "./shuffle";

/**
 * The order options and items are shown in. Deterministic (server and browser render the same), and it changes with
 * `salt`: without one a question always came back with its answers in the same places, so a learner could remember
 * "the second one" instead of the idea. Sessions pass a salt that differs from one attempt or one day to the next.
 */
export function initialOrder(q: Question, salt = ""): string[] {
  const seed = salt ? `${q.id}|${salt}` : q.id;
  switch (q.type) {
    case "mcq":
    case "fill_choice":
    case "ai_analysis":
    case "multi":
      return seededShuffle(q.options.map((o) => o.id), seed);
    case "ordering":
    case "ranking":
      return shuffleAway(q.items.map((i) => i.id), seed);
    case "match":
      return seededShuffle(q.right.map((r) => r.id), seed);
    case "sort":
      return seededShuffle(q.items.map((i) => i.id), seed);
    default:
      return [];
  }
}

/** What the learner starts from: the shuffled list for orderings, empty slots for pairings and bins. */
export function initialDraft(q: Question, salt = ""): Answer | null {
  if (q.type === "ordering" || q.type === "ranking") return initialOrder(q, salt);
  if (q.type === "match") return q.left.map(() => "");
  if (q.type === "sort") return q.items.map(() => "");
  return null;
}
