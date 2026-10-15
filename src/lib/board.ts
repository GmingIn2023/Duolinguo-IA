import type { Lesson, MapNode, ThemeId, Track } from "@/content/types";

export type NodeStatus = "completed" | "covered" | "recommended" | "available" | "locked";

export type BoardNode = {
  node: MapNode;
  lesson?: Lesson;
  status: NodeStatus;
  /** Titles of what still blocks this node. Empty unless locked. */
  missing: { id: string; title: string }[];
  /** Node ids this one is drawn after. */
  from: string[];
};

/**
 * What the placement test lets a learner step over: a level out of 10 covers a lesson when it
 * clears the lesson's difficulty with a margin (difficulty 1 from 4/10, 2 from 6/10, 3 from 8/10,
 * 4 from 10/10; difficulty 5 is never skipped).
 */
export const coveredByLevel = (difficulty: number, level10: number) => difficulty < 5 && level10 >= difficulty * 2 + 2;

export type Knowledge = {
  completed: ReadonlySet<string>;
  level10: number;
  /** Checkpoint ids already passed. */
  checkpoints?: ReadonlySet<string>;
};

/** A lesson counts as known when completed, or covered by the placement level. */
export const isKnown = (lesson: Lesson, k: Knowledge) => k.completed.has(lesson.id) || coveredByLevel(lesson.difficulty, k.level10);

/** Prerequisites that are neither completed nor covered. Global: independent of the track. */
export function missingPrerequisites(lesson: Lesson, k: Knowledge, getLesson: (id: string) => Lesson | undefined): Lesson[] {
  return lesson.prerequisites.map(getLesson).filter((p): p is Lesson => Boolean(p) && !isKnown(p!, k));
}

export const isUnlocked = (lesson: Lesson, k: Knowledge, getLesson: (id: string) => Lesson | undefined) =>
  missingPrerequisites(lesson, k, getLesson).length === 0;

/**
 * Status of every node of a board.
 * - lesson: completed, covered (validated by the placement test, still playable), available or locked by prerequisites.
 * - checkpoint: available once every lesson it covers is known.
 * Exactly one open node is "recommended": the earliest on the board, or the earliest in the learner's preferred themes.
 */
export function boardStatuses(
  track: Track,
  k: Knowledge,
  getLesson: (id: string) => Lesson | undefined,
  themeOrder: ThemeId[] = [],
): BoardNode[] {
  const inTrack = new Set(track.nodes.map((n) => n.id));
  const nodes: BoardNode[] = track.nodes.map((node) => {
    if (node.kind === "checkpoint") {
      const covers = (node.covers ?? []).map(getLesson).filter((l): l is Lesson => Boolean(l));
      const missing = covers.filter((l) => !isKnown(l, k));
      const status: NodeStatus = k.checkpoints?.has(node.id) ? "completed" : missing.length ? "locked" : "available";
      return { node, status, missing: missing.map((l) => ({ id: l.id, title: l.title })), from: (node.after ?? []).filter((id) => inTrack.has(id)) };
    }
    const lesson = getLesson(node.lessonId!);
    if (!lesson) return { node, status: "locked" as NodeStatus, missing: [], from: [] };
    const missing = missingPrerequisites(lesson, k, getLesson);
    const status: NodeStatus = k.completed.has(lesson.id)
      ? "completed"
      : missing.length
        ? "locked"
        : coveredByLevel(lesson.difficulty, k.level10)
          ? "covered"
          : "available";
    return {
      node,
      lesson,
      status,
      missing: missing.map((l) => ({ id: l.id, title: l.title })),
      from: [...lesson.prerequisites.filter((id) => inTrack.has(id)), ...(node.after ?? []).filter((id) => inTrack.has(id))],
    };
  });

  const rank = (b: BoardNode) => {
    const pref = b.lesson ? themeOrder.indexOf(b.lesson.theme) : -1;
    return [pref === -1 ? themeOrder.length : pref, b.node.col, Math.abs(b.node.lane), b.node.lane];
  };
  const byRank = (a: BoardNode, b: BoardNode) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
    return 0;
  };
  const open = nodes.filter((n) => n.status === "available").sort(byRank);
  // nothing new left: point at the first lesson the test validated but the learner never played
  const next = open[0] ?? nodes.filter((n) => n.status === "covered").sort(byRank)[0];
  if (next) next.status = "recommended";
  return nodes;
}

export type BoardSummary = { done: number; total: number; minutesLeft: number; finished: boolean };

/** Lessons done (completed or covered) and honest time left on the board. */
export function boardSummary(nodes: BoardNode[]): BoardSummary {
  const lessons = nodes.filter((n) => n.lesson);
  const done = lessons.filter((n) => n.status === "completed" || n.status === "covered").length;
  const minutesLeft = lessons.filter((n) => n.status !== "completed" && n.status !== "covered").reduce((s, n) => s + n.lesson!.durationMin, 0);
  return { done, total: lessons.length, minutesLeft, finished: lessons.every((n) => n.status === "completed") };
}

/* ───────────────────────── Geometry ───────────────────────── */

export type Orientation = "horizontal" | "vertical";
export type Point = { x: number; y: number };

export const BOARD = {
  horizontal: { stepMain: 208, stepCross: 124, padMain: 120, padCross: 96 },
  vertical: { stepMain: 116, stepCross: 58, padMain: 84, padCross: 40 },
} as const;

/** Small deterministic offset so the path wanders like a hand-drawn board instead of sitting on a grid. */
function wobble(id: string, amplitude: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 2 * amplitude;
}

export function layoutBoard(track: Track, orientation: Orientation) {
  const g = BOARD[orientation];
  const lanes = track.nodes.map((n) => n.lane);
  const minLane = Math.min(...lanes);
  const maxLane = Math.max(...lanes);
  const maxCol = Math.max(...track.nodes.map((n) => n.col));
  const points = new Map<string, Point>();
  for (const n of track.nodes) {
    const main = g.padMain + n.col * g.stepMain + wobble(n.id, orientation === "horizontal" ? 18 : 10);
    const cross = g.padCross + (n.lane - minLane) * g.stepCross + wobble(`${n.id}~`, orientation === "horizontal" ? 14 : 6);
    points.set(n.id, orientation === "horizontal" ? { x: main, y: cross } : { x: cross, y: main });
  }
  const mainSize = g.padMain * 2 + maxCol * g.stepMain;
  const crossSize = g.padCross * 2 + (maxLane - minLane) * g.stepCross;
  const size = orientation === "horizontal" ? { width: mainSize, height: crossSize } : { width: crossSize, height: mainSize };

  /** Where each unit starts and ends along the main axis, for the unit bands. */
  const units = track.units.map((u) => {
    const cols = track.nodes.filter((n) => n.unit === u.id).map((n) => n.col);
    const from = g.padMain + Math.min(...cols) * g.stepMain - g.stepMain / 2;
    const to = g.padMain + Math.max(...cols) * g.stepMain + g.stepMain / 2;
    return { unit: u, from, to };
  });
  return { points, size, units };
}

/** A smooth S-curve between two nodes, leaving and arriving along the main axis. */
export function edgePath(a: Point, b: Point, orientation: Orientation): string {
  if (orientation === "horizontal") {
    const mid = (a.x + b.x) / 2;
    return `M${a.x},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x},${b.y}`;
  }
  const mid = (a.y + b.y) / 2;
  return `M${a.x},${a.y} C${a.x},${mid} ${b.x},${mid} ${b.x},${b.y}`;
}
