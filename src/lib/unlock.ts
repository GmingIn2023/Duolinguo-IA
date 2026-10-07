import type { Lesson } from "@/content/types";

export type LessonStatus = "completed" | "current" | "available" | "locked";

/**
 * A lesson opens when its prerequisites are done, or when it sits below the learner's placement level.
 * The first open, unfinished lesson is "current".
 */
export function lessonStatuses(lessons: Lesson[], completed: Set<string>, placementLevel: number) {
  let currentAssigned = false;
  return lessons.map((lesson) => {
    if (completed.has(lesson.id)) return { lesson, status: "completed" as LessonStatus };
    const open = lesson.level < placementLevel || lesson.prerequisites.every((p) => completed.has(p));
    if (!open) return { lesson, status: "locked" as LessonStatus };
    const status: LessonStatus = currentAssigned ? "available" : "current";
    currentAssigned = true;
    return { lesson, status };
  });
}
