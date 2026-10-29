import { LESSONS, THEMES, THEME_IDS, TRACKS, TRACK_IDS, getLesson } from "@/content";
import type { ThemeId, TrackId } from "@/content/types";

export type LandingChapter = { id: string; name: string; project: boolean; lessons: { id: string; title: string; theme: ThemeId; minutes: number }[] };

export type LandingTrack = {
  track: TrackId;
  name: string;
  animal: string;
  audience: string;
  pitch: string;
  lessons: number;
  chapters: LandingChapter[];
};

export type LandingPlan = {
  tracks: Record<TrackId, LandingTrack>;
  /** Lessons across all tracks (each lesson belongs to one track). */
  totalLessons: number;
  themes: { id: ThemeId; name: string; pitch: string; lessons: number; tracks: TrackId[] }[];
};

/** The three tracks as the landing draws them, from the real curriculum, so the page can never drift from the product. */
export function buildLandingPlan(): LandingPlan {
  const tracks = {} as Record<TrackId, LandingTrack>;
  for (const id of TRACK_IDS) {
    const t = TRACKS[id];
    const chapters = t.chapters.map((c) => ({
      id: c.id,
      name: c.name,
      project: Boolean(c.project),
      lessons: c.lessons.map(getLesson).flatMap((l) => (l ? [{ id: l.id, title: l.title, theme: l.theme, minutes: l.durationMin }] : [])),
    }));
    tracks[id] = { track: id, name: t.name, animal: t.animal, audience: t.audience, pitch: t.pitch, lessons: chapters.reduce((n, c) => n + c.lessons.length, 0), chapters };
  }
  const themes = THEME_IDS.map((tid) => {
    const ids = new Set(LESSONS.filter((l) => l.theme === tid).map((l) => l.id));
    const inTracks = TRACK_IDS.filter((id) => tracks[id].chapters.some((c) => c.lessons.some((l) => ids.has(l.id))));
    return { id: tid, name: THEMES[tid].name, pitch: THEMES[tid].pitch, lessons: ids.size, tracks: inTracks };
  });
  return { tracks, totalLessons: LESSONS.length, themes };
}
