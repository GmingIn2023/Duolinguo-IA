"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Note } from "@/lib/types";
import { NoteCard, NoteComposer, useNotes } from "./NoteBits";

export type LessonRef = { id: string; title: string; theme: string; sections: Record<string, string> };

export function NotesWall({ initial, lessons }: { initial: Note[]; lessons: Record<string, LessonRef> }) {
  const { notes, add, change, remove } = useNotes(initial);
  const [query, setQuery] = useState("");
  const [lesson, setLesson] = useState<string | null>(null);

  const used = useMemo(() => [...new Set(notes.map((n) => n.lesson_id).filter((id): id is string => Boolean(id && lessons[id])))], [notes, lessons]);
  const q = query.trim().toLowerCase();
  const shown = notes.filter((n) => (!lesson || n.lesson_id === lesson) && (!q || n.body.toLowerCase().includes(q)));

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <NoteComposer onAdded={add} placeholder="Une idée, un prompt qui marche, une question à creuser…" />
        <div className="grid gap-3">
          <label className="relative block">
            <span className="sr-only">Chercher dans le carnet</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher dans tes notes" className="field !pl-12" />
          </label>
          {used.length > 0 && (
            <div className="no-scrollbar -my-1 flex gap-2 overflow-x-auto py-1" role="group" aria-label="Filtrer par cours">
              <button type="button" className="chip" aria-pressed={!lesson} onClick={() => setLesson(null)}>Toutes</button>
              {used.map((id) => (
                <button key={id} type="button" className="chip" aria-pressed={lesson === id} onClick={() => setLesson(lesson === id ? null : id)}>{lessons[id].title}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="tile grid max-w-xl gap-3 p-8">
          <p className="display display-s">Ton carnet est vide.</p>
          <p className="text-ink-2">Pendant un cours, l&apos;icône carnet en haut à droite garde une note attachée à la partie que tu lis. À la fin, tu peux y ranger la fiche à retenir.</p>
        </div>
      ) : shown.length === 0 ? (
        <p className="text-ink-2" aria-live="polite">Aucune note ne correspond.</p>
      ) : (
        <div className="note-wall grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((n) => {
            const ref = n.lesson_id ? lessons[n.lesson_id] : undefined;
            const context = ref ? (
              <Link href={`/lesson/${ref.id}`} className="underline">
                {ref.title}
                {n.section_id && ref.sections[n.section_id] ? ` · ${ref.sections[n.section_id]}` : ""}
              </Link>
            ) : undefined;
            return <NoteCard key={n.id} note={n} context={context} onChange={change} onDelete={remove} />;
          })}
        </div>
      )}
    </div>
  );
}
