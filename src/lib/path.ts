import type { Chapter, Lesson, ThemeId, Track, TrackId } from "@/content/types";

/** What the placement test of one track established. */
export type Placement = {
  /** Right answers out of 10. */
  score: number;
  /** Chapters of that track validated by the test. */
  chapters: string[];
  /** ISO date of the test. */
  at: string;
};
export type Placements = Partial<Record<TrackId, Placement>>;

export type Knowledge = {
  completed: ReadonlySet<string>;
  /** Chapter ids validated by a placement test (any track). */
  validated: ReadonlySet<string>;
  /** Chapter reviews ("bilans") already passed. */
  checkpoints?: ReadonlySet<string>;
  /** Free mode: every lesson of the track is open. */
  free?: boolean;
};

export const knowledgeFrom = (completed: Iterable<string>, placements: Placements, extra: Partial<Knowledge> = {}): Knowledge => ({
  completed: new Set(completed),
  validated: new Set(Object.values(placements).flatMap((p) => p?.chapters ?? [])),
  ...extra,
});

export type StepStatus = "completed" | "covered" | "current" | "available" | "locked";
export type StepKind = "lesson" | "checkpoint" | "project";

/** One stop on the path, as the screens need it (no lesson body). */
export type PathStep = {
  id: string;
  kind: StepKind;
  chapterId: string;
  status: StepStatus;
  title: string;
  lessonId?: string;
  theme?: ThemeId;
  objective?: string;
  durationMin?: number;
  xp?: number;
  /** Section to resume at, when the lesson was left half-way. */
  resumeAt?: number;
  /** Locked steps: what to finish first. */
  lockedBy?: string;
};

export type ChapterStatus = "done" | "current" | "open" | "locked";

export type ChapterView = {
  chapter: Chapter;
  index: number;
  status: ChapterStatus;
  steps: PathStep[];
  /** Lessons known (completed or validated) and lessons in the chapter. */
  done: number;
  total: number;
  validatedByTest: boolean;
  /** Locked chapters: the chapter to finish first. */
  lockedBy?: string;
};

export type TrackPath = {
  chapters: ChapterView[];
  current?: PathStep;
  done: number;
  total: number;
  minutesLeft: number;
  finished: boolean;
};

/** A lesson counts as known when completed, or when the placement test validated its chapter. */
export const lessonKnown = (lessonId: string, chapterId: string, k: Knowledge) => k.completed.has(lessonId) || k.validated.has(chapterId);

type Get = (id: string) => Lesson | undefined;

/**
 * The status of every stop of a track, in path order.
 * A lesson opens when the lesson before it is known; the first lesson of a chapter opens when every
 * chapter before it is known. Lessons validated by the test stay playable. The chapter review is optional:
 * it opens once its lessons are known and never blocks the next chapter.
 */
export function trackPath(track: Track, k: Knowledge, getLesson: Get, resume: ReadonlyMap<string, number> = new Map()): TrackPath {
  // the first chapter not fully known: it blocks every chapter after it
  let blocker: string | null = null;
  let current: PathStep | undefined;
  const chapters: ChapterView[] = track.chapters.map((chapter, index) => {
    const steps: PathStep[] = [];
    let previousKnown = blocker === null;
    let previousTitle = blocker ? `le chapitre « ${blocker} »` : "";
    for (const id of chapter.lessons) {
      const lesson = getLesson(id);
      if (!lesson) continue;
      const known = lessonKnown(id, chapter.id, k);
      const open = k.free || previousKnown;
      const status: StepStatus = k.completed.has(id) ? "completed" : k.validated.has(chapter.id) ? "covered" : open ? "available" : "locked";
      const step: PathStep = {
        id,
        kind: chapter.project ? "project" : "lesson",
        chapterId: chapter.id,
        status,
        title: lesson.title,
        lessonId: id,
        theme: lesson.theme,
        objective: lesson.objective,
        durationMin: lesson.durationMin,
        xp: lesson.xp,
        resumeAt: resume.get(id),
        lockedBy: status === "locked" ? previousTitle : undefined,
      };
      if (!current && status === "available") {
        step.status = "current";
        current = step;
      }
      steps.push(step);
      previousKnown = known;
      previousTitle = `« ${lesson.title} »`;
    }
    const lessonSteps = steps.length;
    const known = steps.filter((s) => s.status === "completed" || s.status === "covered").length;
    if (!chapter.project) {
      const ready = known === lessonSteps;
      steps.push({
        id: chapter.id,
        kind: "checkpoint",
        chapterId: chapter.id,
        status: k.checkpoints?.has(chapter.id) ? "completed" : ready ? "available" : "locked",
        title: `Bilan : ${chapter.name}`,
        lockedBy: ready ? undefined : "les cours de ce chapitre",
      });
    }
    const validatedByTest = k.validated.has(chapter.id);
    const lockedBy = blocker === null || k.free ? undefined : blocker;
    const status: ChapterStatus =
      known === lessonSteps ? "done" : steps.some((s) => s.status === "current") ? "current" : lockedBy && known === 0 ? "locked" : "open";
    // a chapter opens only when every chapter before it is known: a gap left by the test is filled first
    if (blocker === null && known !== lessonSteps) blocker = chapter.name;
    return { chapter, index, status, steps, done: known, total: lessonSteps, validatedByTest, lockedBy: status === "locked" ? lockedBy : undefined };
  });

  const lessons = chapters.flatMap((c) => c.steps.filter((s) => s.lessonId));
  const done = lessons.filter((s) => s.status === "completed" || s.status === "covered").length;
  const minutesLeft = lessons.filter((s) => s.status !== "completed" && s.status !== "covered").reduce((sum, s) => sum + (s.durationMin ?? 0), 0);
  return { chapters, current, done, total: lessons.length, minutesLeft, finished: done === lessons.length };
}

/**
 * Whether a learner on `myTrack` may open this lesson. Lessons of another track are open access:
 * they neither block nor are blocked by anything. Lessons of their own track follow the path.
 */
export function canOpenLesson(lessonId: string, myTrack: TrackId, track: Track | undefined, k: Knowledge, getLesson: Get): { ok: true } | { ok: false; first?: PathStep } {
  if (!track || track.id !== myTrack) return { ok: true };
  const path = trackPath(track, k, getLesson);
  const step = path.chapters.flatMap((c) => c.steps).find((s) => s.lessonId === lessonId);
  if (!step || step.status !== "locked") return { ok: true };
  return { ok: false, first: path.current };
}

/** Where a path step leads. */
export const stepHref = (s: Pick<PathStep, "kind" | "id" | "lessonId">) => (s.kind === "checkpoint" ? `/review/checkpoint:${s.id}` : `/lesson/${s.lessonId}`);
