import { TRACKS } from "@/content/curriculum";
import type { TrackId } from "@/content/types";
import type { Placement } from "./path";

/**
 * What a placement result means, kept apart from the question bank so the result screen and the landing
 * can use it without downloading the questions and their answers.
 */

/** The chapters a track's test can validate: every chapter but the project. */
export const testedChapters = (track: TrackId) => TRACKS[track].chapters.filter((c) => !c.project).map((c) => c.id);

export const levelName = (score: number) =>
  score >= 10 ? "Expert" : score >= 8 ? "Avancé" : score >= 6 ? "Intermédiaire" : score >= 4 ? "Bases acquises" : "Tout début";

export const NEXT_TRACK: Partial<Record<TrackId, TrackId>> = { bird: "gecko", gecko: "fox" };
export const PREVIOUS_TRACK: Partial<Record<TrackId, TrackId>> = { gecko: "bird", fox: "gecko" };

export type Verdict =
  | { kind: "start"; chapter: string | null }
  | { kind: "next"; track: TrackId }
  | { kind: "previous"; track: TrackId };

/**
 * What the result screen recommends. Everything validated and 9/10 or more: the next track's test.
 * 3/10 or less: the previous track's test. Otherwise: start this track at the first chapter not validated.
 */
export function placementVerdict(track: TrackId, p: Pick<Placement, "score" | "chapters">): Verdict {
  const chapters = testedChapters(track);
  const next = NEXT_TRACK[track];
  const previous = PREVIOUS_TRACK[track];
  if (next && p.score >= 9 && chapters.every((c) => p.chapters.includes(c))) return { kind: "next", track: next };
  if (previous && p.score <= 3) return { kind: "previous", track: previous };
  return { kind: "start", chapter: TRACKS[track].chapters.find((c) => !p.chapters.includes(c.id))?.id ?? null };
}

