import type { Metadata } from "next";
import { NotesWall, type LessonRef } from "@/components/notes/NotesWall";
import { LESSONS } from "@/content";
import { getNotes } from "@/lib/data";

export const metadata: Metadata = { title: "Carnet" };

export default async function NotesPage() {
  const notes = await getNotes();
  const ids = new Set(notes.map((n) => n.lesson_id));
  const lessons: Record<string, LessonRef> = Object.fromEntries(
    LESSONS.filter((l) => ids.has(l.id)).map((l) => [l.id, { id: l.id, title: l.title, theme: l.theme, sections: Object.fromEntries(l.sections.map((s) => [s.id, s.title])) }]),
  );
  return (
    <div className="grid max-w-6xl gap-8">
      <header className="grid gap-3">
        <h1 className="display display-l">Carnet</h1>
        <p className="lede !max-w-[56ch]">Tes notes, tes fiches, tes prompts qui marchent. Privé : toi seul le vois.</p>
      </header>
      <NotesWall initial={notes} lessons={lessons} />
    </div>
  );
}
