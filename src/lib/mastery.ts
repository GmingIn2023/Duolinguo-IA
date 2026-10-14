import type { Lesson, ThemeId } from "@/content/types";
import type { ReviewItemRow } from "./types";

export type MasteryState = "mastered" | "learning" | "fragile";

/** A scheduled notion is fragile after a recent miss, mastered once it survives a week-long gap. */
export function itemState(item: Pick<ReviewItemRow, "box" | "lapses">): MasteryState {
  if (item.box <= 1) return "fragile";
  if (item.box >= 4) return "mastered";
  return "learning";
}

export type ThemeMastery = {
  theme: ThemeId;
  lessonsDone: number;
  lessonsTotal: number;
  mastered: number;
  learning: number;
  fragile: number;
  /** 0 to 1: share of scheduled notions that are mastered, counting those still being learned for half. */
  score: number;
};

export function themeMastery(
  lessons: Lesson[],
  completed: ReadonlySet<string>,
  items: ReviewItemRow[],
  themes: ThemeId[],
): ThemeMastery[] {
  const themeOf = new Map(lessons.map((l) => [l.id, l.theme]));
  return themes.map((theme) => {
    const own = lessons.filter((l) => l.theme === theme);
    const states = items.filter((i) => themeOf.get(i.lesson_id) === theme).map(itemState);
    const count = (s: MasteryState) => states.filter((x) => x === s).length;
    const mastered = count("mastered");
    const learning = count("learning");
    return {
      theme,
      lessonsDone: own.filter((l) => completed.has(l.id)).length,
      lessonsTotal: own.length,
      mastered,
      learning,
      fragile: count("fragile"),
      score: states.length ? (mastered + learning * 0.5) / states.length : 0,
    };
  });
}

/** Lessons whose notions were missed most: what to rework first. */
export function weakLessons(items: ReviewItemRow[], limit = 3): { lessonId: string; fragile: number }[] {
  const by = new Map<string, number>();
  for (const i of items) if (itemState(i) === "fragile") by.set(i.lesson_id, (by.get(i.lesson_id) ?? 0) + 1);
  return [...by.entries()].map(([lessonId, fragile]) => ({ lessonId, fragile })).sort((a, b) => b.fragile - a.fragile).slice(0, limit);
}
