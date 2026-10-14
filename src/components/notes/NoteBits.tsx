"use client";

import { useState, useTransition } from "react";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { addNote, deleteNote, updateNote } from "@/app/actions";
import { NOTE_COLORS, NOTE_MAX, type Note, type NoteColor } from "@/lib/types";

const COLOR_NAME: Record<NoteColor, string> = { canary: "Jaune", leaf: "Vert", vermilion: "Orange", sky: "Bleu", lilac: "Lilas" };
const FAILED = "Pas enregistré. Vérifie ta connexion, puis réessaie.";

export function ColorPicker({ value, onChange }: { value: NoteColor; onChange: (c: NoteColor) => void }) {
  return (
    <div role="radiogroup" aria-label="Couleur de la note" className="flex gap-1">
      {NOTE_COLORS.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={COLOR_NAME[c]} data-note={c} onClick={() => onChange(c)} className="grid size-11 place-items-center rounded-full">
          <span className="swatch" data-note={c} aria-checked={value === c} />
        </button>
      ))}
    </div>
  );
}

/** Writes a new note, optionally attached to a lesson section. */
export function NoteComposer({ lessonId, sectionId, onAdded, placeholder = "Ce que tu veux retenir, une question, une idée…", autoFocus }: {
  lessonId?: string;
  sectionId?: string;
  onAdded: (n: Note) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState("");
  const [color, setColor] = useState<NoteColor>("canary");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setError(null);
      try {
        onAdded(await addNote({ body, color, lessonId, sectionId }));
        setBody("");
      } catch (e) {
        setError(e instanceof Error && e.message.length < 120 ? e.message : FAILED);
      }
    });

  return (
    <form
      className="note grid gap-3 p-4"
      data-note={color}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="sr-only" htmlFor={`note-${lessonId ?? "free"}`}>Nouvelle note</label>
      <textarea
        id={`note-${lessonId ?? "free"}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && body.trim()) save();
        }}
        maxLength={NOTE_MAX}
        rows={3}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full resize-y bg-transparent text-[1rem] leading-relaxed outline-none placeholder:text-ink-2/70"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ColorPicker value={color} onChange={setColor} />
        <button className="btn btn-primary !h-11" disabled={pending || !body.trim()}>{pending ? "Enregistrement…" : "Ajouter"}</button>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-bad">{error}</p>}
    </form>
  );
}

/** One note: edit in place, change colour, pin, delete. */
export function NoteCard({ note, context, onChange, onDelete }: { note: Note; context?: React.ReactNode; onChange: (n: Note) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setError(null);
      try {
        await fn();
      } catch {
        setError(FAILED);
      }
    });

  return (
    <article className="note flex flex-col gap-3 p-4" data-note={note.color} aria-busy={pending}>
      {context && <div className="text-[0.8125rem] font-semibold text-ink-2">{context}</div>}
      {editing ? (
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={NOTE_MAX} rows={4} autoFocus aria-label="Modifier la note" className="w-full resize-y rounded-lg bg-surface/60 p-2 leading-relaxed outline-none focus:shadow-[inset_0_0_0_2px_var(--ink)]" />
      ) : (
        <p className="whitespace-pre-wrap break-words leading-relaxed">{note.body}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1">
        {editing ? (
          <>
            <ColorPicker value={note.color} onChange={(color) => run(async () => onChange(await updateNote(note.id, { color })))} />
            <span className="ml-auto flex gap-1">
              <button type="button" className="btn btn-ghost !h-11" onClick={() => { setBody(note.body); setEditing(false); }}>Annuler</button>
              <button type="button" className="btn btn-primary !h-11" disabled={pending || !body.trim()} onClick={() => run(async () => { onChange(await updateNote(note.id, { body })); setEditing(false); })}>Enregistrer</button>
            </span>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost !h-11 !px-3 text-sm" onClick={() => setEditing(true)}>Modifier</button>
            <button type="button" className="icon-btn ml-auto" aria-pressed={note.pinned} aria-label={note.pinned ? "Détacher" : "Épingler en haut"} onClick={() => run(async () => onChange(await updateNote(note.id, { pinned: !note.pinned })))}>
              {note.pinned ? <PinOff className="size-[1.125rem]" aria-hidden /> : <Pin className="size-[1.125rem]" aria-hidden />}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Supprimer la note"
              onClick={() => {
                if (window.confirm("Supprimer cette note ?")) run(async () => { await deleteNote(note.id); onDelete(note.id); });
              }}
            >
              <Trash2 className="size-[1.125rem]" aria-hidden />
            </button>
          </>
        )}
      </div>
      {error && <p role="alert" className="text-sm font-medium text-bad">{error}</p>}
    </article>
  );
}

/** Keeps a note list in sync after add, edit and delete; pinned first, then most recent. */
export function useNotes(initial: Note[]) {
  const [notes, setNotes] = useState(initial);
  const sort = (list: Note[]) => [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at));
  return {
    notes,
    add: (n: Note) => setNotes((l) => sort([n, ...l])),
    change: (n: Note) => setNotes((l) => sort(l.map((x) => (x.id === n.id ? n : x)))),
    remove: (id: string) => setNotes((l) => l.filter((x) => x.id !== id)),
  };
}
