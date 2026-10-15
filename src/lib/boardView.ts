import { getLesson } from "@/content";
import type { Difficulty, LessonFormat, MapNodeKind, ThemeId, Track } from "@/content/types";
import { boardStatuses, boardSummary, type Knowledge, type NodeStatus } from "./board";

/** A board node as the client needs it: plain data, no lesson body. */
export type BoardItem = {
  id: string;
  kind: MapNodeKind;
  col: number;
  lane: number;
  unit: string;
  status: NodeStatus;
  title: string;
  lessonId?: string;
  theme?: ThemeId;
  objective?: string;
  durationMin?: number;
  difficulty?: Difficulty;
  format?: LessonFormat;
  /** Checkpoints: how many lessons they cover. */
  covers?: number;
  missing: { id: string; title: string }[];
  from: string[];
  /** Section to resume at, when the lesson was left unfinished. */
  resumeAt?: number;
};

export function boardView(track: Track, k: Knowledge, themeOrder: ThemeId[], resume: Map<string, number>) {
  const nodes = boardStatuses(track, k, getLesson, themeOrder);
  const items: BoardItem[] = nodes.map(({ node, lesson, status, missing, from }) => ({
    id: node.id,
    kind: node.kind,
    col: node.col,
    lane: node.lane,
    unit: node.unit,
    status,
    title: lesson?.title ?? node.title ?? "",
    lessonId: lesson?.id,
    theme: lesson?.theme,
    objective: lesson?.objective,
    durationMin: lesson?.durationMin,
    difficulty: lesson?.difficulty,
    format: lesson?.format,
    covers: node.covers?.length,
    missing,
    from,
    resumeAt: lesson ? resume.get(lesson.id) : undefined,
  }));
  return { items, summary: boardSummary(nodes) };
}

/** Where a board node leads. */
export const itemHref = (i: Pick<BoardItem, "kind" | "id" | "lessonId">) => (i.kind === "checkpoint" ? `/review/checkpoint:${i.id}` : `/lesson/${i.lessonId}`);
