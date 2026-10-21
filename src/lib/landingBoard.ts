import { LESSONS, THEMES, THEME_IDS, TRACKS, TRACK_IDS, getLesson } from "@/content";
import type { MapNodeKind, ThemeId, TrackId } from "@/content/types";

/** One stop on a track's map, reduced to what the landing needs to draw it. */
export type LandingNode = {
  id: string;
  kind: MapNodeKind;
  title: string;
  /** Theme of a lesson; null for checkpoints. */
  theme: ThemeId | null;
  unit: string;
  col: number;
  lane: number;
  /** Ids of the nodes this one follows (real prerequisites inside the track, plus the map's own links). */
  from: string[];
  /** The lesson also appears on another track: the learner does it once. */
  shared: boolean;
};

export type LandingBoard = {
  track: TrackId;
  name: string;
  animal: string;
  audience: string;
  pitch: string;
  lessons: number;
  maxCol: number;
  minLane: number;
  maxLane: number;
  units: { id: string; name: string; fromCol: number; toCol: number }[];
  nodes: LandingNode[];
};

export type LandingPlan = {
  boards: Record<TrackId, LandingBoard>;
  /** Distinct lessons across all tracks (the number the landing may quote). */
  uniqueLessons: number;
  themes: { id: ThemeId; name: string; pitch: string; lessons: number; tracks: TrackId[] }[];
};

/** Builds the three track maps from the real curriculum, so the landing can never drift from the product. */
export function buildLandingPlan(): LandingPlan {
  const trackCount = new Map<string, Set<TrackId>>();
  for (const id of TRACK_IDS) {
    for (const n of TRACKS[id].nodes) {
      if (!n.lessonId) continue;
      if (!trackCount.has(n.lessonId)) trackCount.set(n.lessonId, new Set());
      trackCount.get(n.lessonId)!.add(id);
    }
  }

  const boards = {} as Record<TrackId, LandingBoard>;
  for (const id of TRACK_IDS) {
    const t = TRACKS[id];
    const inTrack = new Set(t.nodes.map((n) => n.id));
    const nodes: LandingNode[] = t.nodes.map((n) => {
      const lesson = n.lessonId ? getLesson(n.lessonId) : undefined;
      const from = [...(lesson?.prerequisites ?? []), ...(n.after ?? [])].filter((x) => inTrack.has(x) && x !== n.id);
      return {
        id: n.id,
        kind: n.kind,
        title: lesson?.title ?? n.title ?? "",
        theme: lesson?.theme ?? null,
        unit: n.unit,
        col: n.col,
        lane: n.lane,
        from: [...new Set(from)],
        shared: Boolean(n.lessonId) && (trackCount.get(n.lessonId!)?.size ?? 0) > 1,
      };
    });
    // A stop with no declared prerequisite would float on the drawing: tie it to the nearest stop of the previous column (drawing only).
    for (const n of nodes) {
      if (n.from.length || n.col === 0) continue;
      const prevCol = Math.max(...nodes.filter((m) => m.col < n.col).map((m) => m.col));
      const near = nodes.filter((m) => m.col === prevCol).sort((a, b) => Math.abs(a.lane - n.lane) - Math.abs(b.lane - n.lane))[0];
      if (near) n.from = [near.id];
    }
    boards[id] = {
      track: id,
      name: t.name,
      animal: t.animal,
      audience: t.audience,
      pitch: t.pitch,
      lessons: nodes.filter((n) => n.kind !== "checkpoint").length,
      maxCol: Math.max(...nodes.map((n) => n.col)),
      minLane: Math.min(...nodes.map((n) => n.lane)),
      maxLane: Math.max(...nodes.map((n) => n.lane)),
      units: t.units.map((u) => {
        const cols = nodes.filter((n) => n.unit === u.id).map((n) => n.col);
        return { id: u.id, name: u.name, fromCol: Math.min(...cols), toCol: Math.max(...cols) };
      }),
      nodes,
    };
  }

  const themes = THEME_IDS.map((tid) => {
    const ids = LESSONS.filter((l) => l.theme === tid).map((l) => l.id);
    const tracks = TRACK_IDS.filter((id) => ids.some((l) => trackCount.get(l)?.has(id)));
    return { id: tid, name: THEMES[tid].name, pitch: THEMES[tid].pitch, lessons: ids.length, tracks };
  });

  return { boards, uniqueLessons: trackCount.size, themes };
}
