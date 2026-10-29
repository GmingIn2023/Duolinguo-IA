"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, BookmarkPlus, Clock, ExternalLink, NotebookPen, Target, X } from "lucide-react";
import { addNote, completeLesson, saveResume } from "@/app/actions";
import { DIFFICULTY_LABEL } from "@/content/curriculum";
import type { Answer, Lesson, TrackId } from "@/content/types";
import { Avatar } from "@/components/Avatar";
import { Celebration } from "@/components/Celebration";
import { LearnerPrefs } from "@/components/LearnerPrefs";
import { BlockView } from "@/components/lesson/BlockView";
import { NoteCard, NoteComposer, useNotes } from "@/components/notes/NoteBits";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Rich } from "@/components/Rich";
import { FORMAT_LABEL, formatMinutes } from "@/lib/labels";
import { mascotLine } from "@/lib/mascot";
import type { LessonResult, Note } from "@/lib/types";

type Phase = { kind: "intro" } | { kind: "section"; index: number } | { kind: "summary" } | { kind: "quiz" } | { kind: "done" };

export function LessonPlayer({
  lesson,
  track,
  resumeAt,
  notes: initialNotes,
  next,
  completedBefore,
  prefs = { sounds: false, motion: "full", textSize: "normal" },
}: {
  lesson: Lesson;
  track: TrackId;
  resumeAt: number | null;
  notes: Note[];
  next: { id: string; title: string } | null;
  completedBefore: boolean;
  prefs?: { sounds: boolean; motion: "full" | "calm"; textSize: "normal" | "large" };
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [quizProgress, setQuizProgress] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer> | null>(null);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [notesOpen, setNotesOpen] = useState(false);
  const notes = useNotes(initialNotes);
  const top = useRef<HTMLDivElement>(null);

  const sections = lesson.sections;
  const steps = sections.length + 2; // sections, summary, quiz
  const position = phase.kind === "intro" ? 0 : phase.kind === "section" ? phase.index : phase.kind === "summary" ? sections.length : phase.kind === "quiz" ? sections.length + 1 + quizProgress : steps;
  const progress = position / steps;

  const go = useCallback((p: Phase) => {
    setPhase(p);
    window.scrollTo({ top: 0 });
    if (p.kind === "section") saveResume(lesson.id, p.index).catch(() => {}); // best effort: never block reading
  }, [lesson.id]);

  const save = useCallback((a: Record<string, Answer>) => {
    setAnswers(a);
    setPhase({ kind: "done" });
    setError(null);
    startSaving(async () => {
      try {
        setResult(await completeLesson(lesson.id, a));
      } catch {
        setError("Vérifie ta connexion, puis réessaie. Si ça persiste, reconnecte-toi.");
      }
    });
  }, [lesson.id]);

  const section = phase.kind === "section" ? sections[phase.index] : null;

  return (
    <LearnerPrefs.Provider value={{ sounds: prefs.sounds }}>
    <div data-track={track} data-theme={lesson.theme} data-motion={prefs.motion} data-text={prefs.textSize} className="min-h-dvh" ref={top}>
      <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link href="/learn" className="icon-btn" aria-label="Quitter le cours">
            <X className="size-6" aria-hidden />
          </Link>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-label="Avancement du cours" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-th transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${Math.max(progress, 0.02) * 100}%`, boxShadow: "inset 0 -3px 0 var(--th-deep)" }} />
          </div>
          {phase.kind !== "quiz" && phase.kind !== "done" && (
            <button type="button" className="icon-btn relative" aria-label={`Carnet du cours (${notes.notes.length} note${notes.notes.length > 1 ? "s" : ""})`} aria-expanded={notesOpen} onClick={() => setNotesOpen((o) => !o)}>
              <NotebookPen className="size-[1.375rem]" aria-hidden />
              {notes.notes.length > 0 && <span className="tabular absolute right-0.5 top-0.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-th px-1 text-[0.6875rem] font-semibold">{notes.notes.length}</span>}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:pt-10">
        {phase.kind === "intro" && <Intro lesson={lesson} track={track} resumeAt={resumeAt} completedBefore={completedBefore} onStart={(i) => go({ kind: "section", index: i })} />}

        {section && phase.kind === "section" && (
          <SectionView
            key={section.id}
            lesson={lesson}
            index={phase.index}
            track={track}
            onPrev={() => go(phase.index === 0 ? { kind: "intro" } : { kind: "section", index: phase.index - 1 })}
            onNext={() => go(phase.index + 1 < sections.length ? { kind: "section", index: phase.index + 1 } : { kind: "summary" })}
          />
        )}

        {phase.kind === "summary" && <Summary lesson={lesson} onPrev={() => go({ kind: "section", index: sections.length - 1 })} onQuiz={() => go({ kind: "quiz" })} />}

        {phase.kind === "quiz" && (
          <div className="grid gap-6">
            <p className="meta">Quiz · {lesson.questions.length} questions</p>
            <QuizRunner questions={lesson.questions} track={track} onDone={save} onProgress={setQuizProgress} />
          </div>
        )}

        {phase.kind === "done" && (
          <Done lesson={lesson} track={track} saving={saving} error={error} result={result} next={next} sounds={prefs.sounds} onRetrySave={() => answers && save(answers)} />
        )}
      </main>

      {notesOpen && (
        <NotesDrawer
          lesson={lesson}
          sectionId={section?.id}
          notes={notes.notes}
          onAdded={notes.add}
          onChange={notes.change}
          onDelete={notes.remove}
          onClose={() => setNotesOpen(false)}
        />
      )}
    </div>
    </LearnerPrefs.Provider>
  );
}

function Intro({ lesson, track, resumeAt, completedBefore, onStart }: { lesson: Lesson; track: TrackId; resumeAt: number | null; completedBefore: boolean; onStart: (index: number) => void }) {
  const resumable = resumeAt !== null && resumeAt > 0 && resumeAt < lesson.sections.length;
  return (
    <div className="fade-in grid gap-8">
      <div className="grid gap-4">
        <div className="grid gap-3">
          <h1 className="display display-l">{lesson.title}</h1>
          <p className="meta flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="chip chip-th !min-h-7 !px-2.5 text-[0.8125rem] text-ink">{FORMAT_LABEL[lesson.format]}</span>
            {DIFFICULTY_LABEL[lesson.difficulty]} · <Clock className="size-3.5" aria-hidden /> {formatMinutes(lesson.durationMin)}
          </p>
        </div>
        <p className="lede !max-w-[52ch] flex gap-2"><Target className="mt-1 size-5 flex-none" aria-hidden /><span>{lesson.objective}</span></p>
      </div>

      <ol className="grid gap-2" aria-label="Au programme">
        {lesson.sections.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 text-ink-2">
            <span className={`tabular grid size-7 flex-none place-items-center rounded-full text-sm font-semibold ${resumable && i < resumeAt! ? "bg-ink text-paper" : "bg-sunk"}`}>{i + 1}</span>
            {s.title}
          </li>
        ))}
        <li className="flex items-center gap-3 text-ink-2">
          <span className="grid size-7 flex-none place-items-center rounded-full bg-th text-sm font-semibold">Q</span>
          L&apos;essentiel, puis {lesson.questions.length} questions
        </li>
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        {resumable ? (
          <>
            <button className="btn btn-primary btn-lg" onClick={() => onStart(resumeAt!)}>Reprendre à la partie {resumeAt! + 1}</button>
            <button className="btn btn-secondary btn-lg" onClick={() => onStart(0)}>Depuis le début</button>
          </>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => onStart(0)}>{completedBefore ? "Revoir le cours" : "Commencer"}</button>
        )}
      </div>
      <div className="flex items-end gap-3">
        <Avatar track={track} size={120} animate />
        <p className="bubble pop-in mb-6">{mascotLine(track, resumable ? "welcome" : "idle")}</p>
      </div>
    </div>
  );
}

function SectionView({ lesson, index, track, onPrev, onNext }: { lesson: Lesson; index: number; track: TrackId; onPrev: () => void; onNext: () => void }) {
  const section = lesson.sections[index];
  const checks = section.blocks.filter((b) => b.type === "check").length;
  const [checked, setChecked] = useState(0);
  const blocked = checked < checks;
  const last = index === lesson.sections.length - 1;

  return (
    <article className="page-in grid gap-8" aria-labelledby="section-title">
      <header className="grid gap-2">
        <h1 id="section-title" className="display display-m">{section.title}</h1>
        <p className="meta">Partie {index + 1} sur {lesson.sections.length} · {lesson.title}</p>
      </header>
      <div className="flex flex-col gap-8">
        {section.blocks.map((b, i) => (
          <BlockView key={i} block={b} track={track} onCheckDone={b.type === "check" ? () => setChecked((c) => c + 1) : undefined} />
        ))}
      </div>
      <nav className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-between gap-3 border-t border-line bg-paper/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur" aria-label="Parties du cours">
        <button className="btn btn-ghost" onClick={onPrev}><ArrowLeft className="size-5" aria-hidden />Retour</button>
        <div className="flex items-center gap-3">
          {blocked && <span className="meta hidden sm:inline">Réponds à la question pour continuer</span>}
          <button className="btn btn-primary" onClick={onNext} disabled={blocked} aria-describedby={blocked ? "blocked-hint" : undefined}>
            {last ? "Fiche à retenir" : "Suivant"}
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
        {blocked && <span id="blocked-hint" className="sr-only">Réponds à la question de cette partie pour continuer.</span>}
      </nav>
    </article>
  );
}

function Summary({ lesson, onPrev, onQuiz }: { lesson: Lesson; onPrev: () => void; onQuiz: () => void }) {
  const [saved, setSaved] = useState<"idle" | "saving" | "done" | "error">("idle");
  const keep = async () => {
    setSaved("saving");
    try {
      await addNote({ body: `${lesson.title}\n\n${lesson.summary.map((s) => `• ${s.replace(/\*\*|`/g, "")}`).join("\n")}`, color: "canary", lessonId: lesson.id });
      setSaved("done");
    } catch {
      setSaved("error");
    }
  };
  return (
    <div className="page-in grid gap-8">
      <header className="grid gap-2">
        <h1 className="display display-m">L&apos;essentiel</h1>
        <p className="meta">{lesson.title}</p>
      </header>
      <ol className="note grid gap-4 p-6 sm:p-8" data-note="canary">
        {lesson.summary.map((s, i) => (
          <li key={i} className="flex gap-4">
            <span className="display tabular text-[1.5rem] leading-none text-th-deep">{i + 1}</span>
            <Rich text={s} as="p" className="text-[1.0625rem] leading-relaxed" />
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-secondary" onClick={keep} disabled={saved === "saving" || saved === "done"}>
          <BookmarkPlus className="size-5" aria-hidden />
          {saved === "done" ? "Ajoutée à ton carnet" : saved === "saving" ? "Ajout…" : "Garder dans mon carnet"}
        </button>
        {saved === "error" && <p role="alert" className="text-sm font-medium text-bad">Pas enregistrée. Réessaie.</p>}
      </div>
      {lesson.sources.length > 0 && (
        <section className="grid gap-3" aria-labelledby="sources">
          <h2 id="sources" className="text-sm font-semibold">Sources</h2>
          <ul className="grid gap-2 text-[0.9375rem]">
            {lesson.sources.map((s) => (
              <li key={s.url} className="flex flex-wrap items-baseline gap-x-2">
                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-baseline gap-1 font-medium underline">
                  {s.title}
                  <ExternalLink className="size-3.5 translate-y-0.5" aria-hidden />
                </a>
                <span className="text-muted">{s.publisher} · vérifiée le {new Date(s.verified).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <nav className="flex items-center justify-between gap-3 border-t border-line pt-4" aria-label="Suite">
        <button className="btn btn-ghost" onClick={onPrev}><ArrowLeft className="size-5" aria-hidden />Retour</button>
        <button className="btn btn-primary btn-lg" onClick={onQuiz}>Passer au quiz<ArrowRight className="size-5" aria-hidden /></button>
      </nav>
    </div>
  );
}

function NotesDrawer({ lesson, sectionId, notes, onAdded, onChange, onDelete, onClose }: {
  lesson: Lesson;
  sectionId?: string;
  notes: Note[];
  onAdded: (n: Note) => void;
  onChange: (n: Note) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const sectionTitle = (id: string | null) => lesson.sections.find((s) => s.id === id)?.title;
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="notes-title">
      <button className="absolute inset-0 bg-ink/30" aria-label="Fermer le carnet" onClick={onClose} tabIndex={-1} />
      <aside className="relative flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-paper p-5 shadow-[-1.5px_0_0_var(--line)] sm:p-6" style={{ animation: "fadeIn 240ms var(--ease-out) both" }}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="notes-title" className="display display-s">Mes notes</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><X className="size-5" aria-hidden /></button>
        </div>
        <p className="text-sm text-ink-2">{sectionTitle(sectionId ?? null) ? <>Attachée à « {sectionTitle(sectionId ?? null)} ».</> : "Attachée à ce cours."} Tout est rangé dans ton <Link href="/notes" className="font-semibold underline">carnet</Link>.</p>
        <NoteComposer lessonId={lesson.id} sectionId={sectionId} onAdded={onAdded} autoFocus />
        <div className="note-wall grid gap-4">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} context={sectionTitle(n.section_id)} onChange={onChange} onDelete={onDelete} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function Done({ lesson, track, saving, error, result, next, sounds, onRetrySave }: {
  lesson: Lesson;
  track: TrackId;
  saving: boolean;
  error: string | null;
  result: LessonResult | null;
  next: { id: string; title: string } | null;
  sounds: boolean;
  onRetrySave: () => void;
}) {
  if (error) {
    return (
      <div className="fade-in grid max-w-xl gap-5 py-10">
        <h1 className="display display-m">Ta progression n&apos;a pas été enregistrée.</h1>
        <p className="lede">{error}</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={onRetrySave}>Réessayer l&apos;enregistrement</button>
          <Link href="/login" className="btn btn-secondary">Se reconnecter</Link>
        </div>
      </div>
    );
  }
  if (saving || !result) {
    return (
      <div className="grid justify-items-center gap-4 py-16" aria-busy="true" aria-live="polite">
        <Avatar track={track} mood="think" size={96} animate />
        <p className="text-muted">Enregistrement de ta progression…</p>
      </div>
    );
  }
  const perfect = result.correct === result.total;
  return (
    <div className="grid gap-8 py-4">
      <Celebration
        track={track}
        xp={result.xpEarned}
        title={perfect ? "Sans faute !" : "Cours terminé !"}
        line={mascotLine(track, perfect ? "perfect" : "done", result.totalXp)}
        sounds={sounds}
        stats={[
          { label: "Du premier coup", value: `${result.correct}/${result.total}` },
          { label: "Série", value: `${result.streak} j`, icon: "streak" },
          { label: "Total", value: String(result.totalXp), icon: "xp" },
        ]}
      />
      <section className="fade-in grid gap-2 [animation-delay:700ms]">
        <h2 className="text-sm font-semibold text-muted">Ce que tu sais faire maintenant</h2>
        <ul className="flex flex-wrap gap-2">
          {lesson.skills.map((s) => <li key={s} className="chip chip-th">{s}</li>)}
        </ul>
      </section>
      <div className="fade-in grid gap-3 [animation-delay:800ms] sm:flex sm:flex-wrap">
        {next && <Link href={`/lesson/${next.id}`} className="btn btn-primary btn-lg" aria-label={`Cours suivant : ${next.title}`}>Cours suivant<ArrowRight className="size-5" aria-hidden /></Link>}
        <Link href="/learn" className={`btn btn-lg ${next ? "btn-secondary" : "btn-primary"}`}>Retour au chemin</Link>
      </div>
    </div>
  );
}
