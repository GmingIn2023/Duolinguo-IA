import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Lock, Play } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { THEMES, TRACKS, TRACK_IDS, getLesson, isThemeId } from "@/content";
import { getKnowledge, getResume, requireViewer } from "@/lib/data";
import { formatMinutes } from "@/lib/labels";
import { trackPath, type PathStep } from "@/lib/path";

export async function generateMetadata(props: PageProps<"/courses/[theme]">): Promise<Metadata> {
  const { theme } = await props.params;
  return { title: isThemeId(theme) ? THEMES[theme].name : "Cours" };
}

const LENGTHS = [
  { id: "all", label: "Tous" },
  { id: "short", label: "Courts" },
  { id: "long", label: "Longs" },
] as const;

/** One theme: the learner's courses on it (a handful), a single length filter in the corner, other tracks folded away. */
export default async function ThemePage(props: PageProps<"/courses/[theme]">) {
  const { theme } = await props.params;
  if (!isThemeId(theme)) notFound();
  const sp = await props.searchParams;
  const length = sp.length === "short" || sp.length === "long" ? sp.length : "all";
  const { profile } = await requireViewer();
  const trackId = profile.track_id ?? "bird";
  const [{ knowledge }, resume] = await Promise.all([getKnowledge(), getResume()]);
  const fits = (s: PathStep) => length === "all" || (length === "short" ? (s.durationMin ?? 0) <= 5 : (s.durationMin ?? 0) > 5);

  const mine = trackPath(TRACKS[trackId], knowledge, getLesson, resume).chapters.flatMap((c) => c.steps.filter((s) => s.lessonId && s.theme === theme).map((s) => ({ step: s, chapter: c.index + 1 })));
  const shown = mine.filter((m) => fits(m.step));
  const others = TRACK_IDS.filter((id) => id !== trackId).flatMap((id) =>
    TRACKS[id].chapters.flatMap((c) => c.lessons.map(getLesson).filter((l) => l && l.theme === theme).map((l) => ({ lesson: l!, track: id }))),
  );

  return (
    <div className="mx-auto grid max-w-2xl gap-6" data-track={trackId} data-theme={theme}>
      <header className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/courses" className="icon-btn -ml-2" aria-label="Retour aux cours"><ArrowLeft className="size-6" aria-hidden /></Link>
          <nav className="flex gap-1 rounded-full bg-surface p-1 shadow-[inset_0_0_0_1.5px_var(--line)]" aria-label="Durée">
            {LENGTHS.map((l) => (
              <Link key={l.id} href={l.id === "all" ? `/courses/${theme}` : `/courses/${theme}?length=${l.id}`} aria-current={length === l.id ? "true" : undefined} className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-2 aria-[current=true]:bg-ink aria-[current=true]:text-paper">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="tile-th grid size-16 flex-none place-items-center rounded-full"><ThemeGlyph theme={theme} size={30} /></span>
          <div className="grid gap-1">
            <h1 className="display display-l">{THEMES[theme].name}</h1>
            <p className="text-ink-2">{THEMES[theme].pitch}</p>
          </div>
        </div>
      </header>

      {shown.length ? (
        <ul className="grid gap-3">
          {shown.map(({ step, chapter }) => (
            <li key={step.id}>
              <CourseRow step={step} chapter={chapter} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="tile grid justify-items-start gap-3 p-6">
          <p className="font-semibold">{mine.length ? "Aucun cours de cette durée ici." : "Ce thème n'est pas dans ton parcours."}</p>
          {mine.length > 0 && <Link href={`/courses/${theme}`} className="btn btn-secondary">Voir tous les cours</Link>}
        </div>
      )}

      {others.length > 0 && (
        <details className="group grid gap-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-muted">
            <span className="transition-transform group-open:rotate-90" aria-hidden>›</span>
            Dans les autres parcours ({others.length})
          </summary>
          <p className="mt-2 text-sm text-muted">En accès libre, hors de ton chemin.</p>
          <ul className="mt-3 grid gap-2">
            {others.map(({ lesson, track }) => (
              <li key={lesson.id}>
                <Link href={`/lesson/${lesson.id}`} data-track={track} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[0_3px_0_var(--edge)]">
                  <Avatar track={track} size={32} decorative />
                  <span className="flex-1 font-medium">{lesson.title}</span>
                  <span className="meta">{TRACKS[track].name} · {formatMinutes(lesson.durationMin)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function CourseRow({ step, chapter }: { step: PathStep; chapter: number }) {
  const locked = step.status === "locked";
  const done = step.status === "completed" || step.status === "covered";
  const body = (
    <>
      <span className="grid flex-1 gap-0.5">
        <span className={`display display-xs ${locked ? "text-ink-2" : ""}`}>{step.title}</span>
        <span className="meta">
          Chapitre {chapter} · {formatMinutes(step.durationMin ?? 0)}
          {step.status === "covered" ? " · validé par ton test" : step.resumeAt !== undefined && !done ? " · en cours" : ""}
        </span>
      </span>
      <span className={`grid size-11 flex-none place-items-center rounded-full ${done ? "bg-good text-white" : locked ? "bg-sunk text-muted" : "bg-accent shadow-[inset_0_-3px_0_var(--accent-deep)]"}`}>
        {done ? <Check className="size-5" strokeWidth={3} aria-hidden /> : locked ? <Lock className="size-4" aria-hidden /> : <Play className="size-5 fill-current" aria-hidden />}
      </span>
    </>
  );
  return locked ? (
    <div className="tile-sunk tile flex items-center gap-4 p-4" title={`Termine d'abord ${step.lockedBy}.`}>
      {body}
      <span className="sr-only">Verrouillé : termine d&apos;abord {step.lockedBy}.</span>
    </div>
  ) : (
    <Link href={`/lesson/${step.lessonId}`} className="tile tile-press flex items-center gap-4 p-4">{body}</Link>
  );
}
