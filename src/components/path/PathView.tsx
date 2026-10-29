"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Flag, List, Lock, Star } from "lucide-react";
import { Avatar, type Mood } from "@/components/Avatar";
import type { TrackId } from "@/content/types";
import { formatMinutes } from "@/lib/labels";
import type { ChapterView, PathStep } from "@/lib/path";
import { Chest } from "./Chest";

const STEP_H = 104;
const AMP = 68;

/** Horizontal offset of the j-th stop of a chapter: a gentle wave, mirrored every other chapter. */
const offset = (j: number, chapterIndex: number) => Math.round(Math.sin((j * Math.PI) / 4) * AMP) * (chapterIndex % 2 ? -1 : 1);

const STATUS_LABEL: Record<PathStep["status"], string> = {
  completed: "terminé",
  covered: "validé par ton test",
  current: "à faire maintenant",
  available: "ouvert",
  locked: "verrouillé",
};

/**
 * The learner's track as a single path, top to bottom, Duolingo style. A sticky banner names the chapter in
 * view and opens the chapter overview. Tapping a stop opens a short card: title, time, one line, one button.
 */
export function PathView({ track, chapters, tested }: { track: TrackId; chapters: ChapterView[]; tested: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const currentChapter = Math.max(0, chapters.findIndex((c) => c.status === "current"));
  const [inView, setInView] = useState(currentChapter);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const currentRef = useRef<HTMLDivElement>(null);

  // the banner follows the chapter being read
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setInView(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-140px 0px -65% 0px" },
    );
    sections.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, []);

  // land on the step to do now, unless the address points at a chapter
  useEffect(() => {
    if (window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" });
      return;
    }
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && (e.target as HTMLElement).closest("[data-step-card], [data-step-node]")) return;
      setOpen(null);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("click", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("click", close);
    };
  }, [open]);

  const banner = chapters[inView] ?? chapters[0];

  return (
    <div className="relative grid gap-2" data-track={track}>
      <div className="path-banner sticky top-[3.75rem] z-20 lg:top-4">
        <div className="grid min-w-0 flex-1 gap-0.5 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold opacity-75">
            Chapitre {banner.index + 1} · {banner.done}/{banner.total} cours
          </p>
          <p className="display display-s truncate">{banner.chapter.name}</p>
        </div>
        <Link href="/learn/chapitres" className="path-banner-btn" aria-label="Voir tous les chapitres">
          <List className="size-6" strokeWidth={2.4} aria-hidden />
        </Link>
      </div>

      <ol className="grid">
        {chapters.map((c, ci) => (
          <li key={c.chapter.id} id={`ch-${c.chapter.id}`} className="scroll-mt-40" data-index={ci} ref={(el) => { sections.current[ci] = el; }}>
            {ci > 0 && (
              <div className="path-divider" aria-hidden>
                <span>{c.chapter.name}</span>
              </div>
            )}
            <h2 className="sr-only">
              Chapitre {ci + 1} : {c.chapter.name}
              {c.status === "locked" ? ` (verrouillé, termine d'abord « ${c.lockedBy} »)` : ""}
            </h2>
            <ul className="relative mx-auto w-full max-w-sm py-4">
              {c.steps.map((s, j) => {
                const x = offset(j, ci);
                const isCurrent = s.status === "current";
                return (
                  <li key={s.id} className="relative flex justify-center" style={{ height: STEP_H }}>
                    <div className="relative" style={{ transform: `translateX(${x}px)` }} ref={isCurrent ? currentRef : undefined}>
                      {isCurrent && open === null && <span className="path-start" aria-hidden>{s.resumeAt ? "Reprendre" : "Commencer"}</span>}
                      <StepNode step={s} expanded={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />
                    </div>
                    {j === 1 && <Mascot track={track} chapter={c} side={x >= 0 ? -1 : 1} />}
                    {open === s.id && <StepCard step={s} chapter={c} tested={tested} />}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepNode({ step, expanded, onToggle }: { step: PathStep; expanded: boolean; onToggle: () => void }) {
  const icon =
    step.kind === "checkpoint" ? (
      <Chest state={step.status === "completed" ? "open" : step.status === "locked" ? "locked" : "ready"} size={72} />
    ) : step.status === "locked" ? (
      <Lock className="size-7" strokeWidth={2.6} aria-hidden />
    ) : step.kind === "project" ? (
      <Flag className="size-8" strokeWidth={2.6} aria-hidden />
    ) : step.status === "completed" || step.status === "covered" ? (
      <Check className="size-8" strokeWidth={3.4} aria-hidden />
    ) : (
      <Star className="size-8 fill-current" strokeWidth={2} aria-hidden />
    );
  return (
    <button
      type="button"
      data-step-node
      className={`pnode${step.kind === "checkpoint" ? " pnode-chest" : ""}${step.kind === "project" ? " pnode-project" : ""}`}
      data-status={step.status}
      aria-expanded={expanded}
      aria-label={`${step.title} : ${STATUS_LABEL[step.status]}`}
      onClick={onToggle}
    >
      {step.status === "current" && <span className="pnode-ring" aria-hidden />}
      <span className="pnode-face">{icon}</span>
      {step.status === "covered" && <span className="pnode-badge" aria-hidden><Check className="size-3" strokeWidth={4} /></span>}
    </button>
  );
}

function StepCard({ step, chapter, tested }: { step: PathStep; chapter: ChapterView; tested: boolean }) {
  const href = step.kind === "checkpoint" ? `/review/checkpoint:${step.id}` : `/lesson/${step.lessonId}`;
  const meta = step.kind === "checkpoint" ? "Bilan du chapitre · facultatif" : [step.durationMin && formatMinutes(step.durationMin), step.xp && `+${step.xp} XP`].filter(Boolean).join(" · ");
  const cta =
    step.status === "locked" ? null : step.kind === "checkpoint" ? (step.status === "completed" ? "Refaire le bilan" : "Passer le bilan") : step.status === "completed" ? "Revoir" : step.status === "covered" ? "Le faire quand même" : step.resumeAt ? "Reprendre" : "Commencer";
  return (
    <div data-step-card className="path-card pop-in" role="dialog" aria-label={step.title}>
      <div className="flex items-start justify-between gap-3">
        <p className="display display-xs">{step.title}</p>
        {tested && step.kind !== "checkpoint" && (
          <span
            className="test-badge"
            data-ok={chapter.validatedByTest || undefined}
            title={chapter.validatedByTest ? "Ton test de niveau a validé ce chapitre : tu peux le passer." : "Ton test de niveau n'a pas validé ce chapitre : ce cours est pour toi."}
          >
            <i aria-hidden />
            Test
            <span className="sr-only">{chapter.validatedByTest ? " : chapitre validé" : " : chapitre à faire"}</span>
          </span>
        )}
      </div>
      <p className="meta">{meta}</p>
      {step.status === "locked" ? (
        <p className="text-[0.9375rem] text-ink-2">Termine d&apos;abord {step.lockedBy}.</p>
      ) : (
        step.objective && <p className="line-clamp-2 text-[0.9375rem] text-ink-2">{step.objective}</p>
      )}
      {cta && (
        <Link href={href} className="btn btn-accent btn-block">
          {cta}
        </Link>
      )}
    </div>
  );
}

function Mascot({ track, chapter, side }: { track: TrackId; chapter: ChapterView; side: -1 | 1 }) {
  const mood: Mood = chapter.status === "done" ? "cheer" : chapter.status === "locked" ? "sleep" : chapter.status === "current" ? "happy" : "think";
  return (
    <div className="path-mascot" style={{ left: `calc(50% + ${side * 128}px)` }} aria-hidden>
      <Avatar track={track} mood={mood} size={92} animate={chapter.status === "current"} decorative />
    </div>
  );
}
