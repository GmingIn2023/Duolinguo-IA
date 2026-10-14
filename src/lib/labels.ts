import type { LessonFormat } from "@/content/types";

export const FORMAT_LABEL: Record<LessonFormat, string> = {
  notion: "Notion",
  atelier: "Atelier",
  "etude-de-cas": "Étude de cas",
  comparatif: "Comparatif",
  labo: "Labo",
  projet: "Projet",
};

/** "1 h 05" above an hour, "25 min" below. */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}
