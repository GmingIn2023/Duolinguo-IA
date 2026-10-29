import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Puzzle } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { THEMES, THEME_IDS, TRACKS, getLesson } from "@/content";
import { DAILY_LIMIT, getDueItems, getKnowledge, getResume, requireViewer } from "@/lib/data";
import { formatMinutes } from "@/lib/labels";
import { stepHref, trackPath } from "@/lib/path";

export const metadata: Metadata = { title: "Cours" };

/** Every course of the learner's track, by theme. One featured card on top, then one row per theme. */
export default async function CoursesPage() {
  const { profile } = await requireViewer();
  const trackId = profile.track_id ?? "bird";
  const [{ knowledge }, resume, due] = await Promise.all([getKnowledge(), getResume(), getDueItems()]);
  const path = trackPath(TRACKS[trackId], knowledge, getLesson, resume);
  const lessons = path.chapters.flatMap((c) => c.steps.filter((s) => s.lessonId));
  const themes = THEME_IDS.map((t) => ({ id: t, lessons: lessons.filter((s) => s.theme === t) })).filter((t) => t.lessons.length);
  const reviews = Math.min(due.length, DAILY_LIMIT);
  const current = path.current;

  return (
    <div className="mx-auto grid max-w-2xl gap-8" data-track={trackId}>
      <h1 className="display display-l">Cours</h1>

      {reviews > 0 ? (
        <Featured
          title="Révision du jour"
          line={`${reviews} notion${reviews > 1 ? "s" : ""} à revoir, environ ${Math.max(2, Math.round(reviews * 0.5))} min.`}
          href="/review/daily"
          cta="Réviser"
          track={trackId}
        />
      ) : current ? (
        <Featured title={current.title} line={current.objective ?? ""} href={stepHref(current)} cta={`Commencer${current.xp ? ` · +${current.xp} XP` : ""}`} track={trackId} />
      ) : null}

      <section className="grid gap-3" aria-labelledby="themes">
        <h2 id="themes" className="font-semibold text-muted">Thèmes de ton parcours</h2>
        <ul className="grid gap-3">
          {themes.map((t) => {
            const done = t.lessons.filter((s) => s.status === "completed" || s.status === "covered").length;
            const minutes = t.lessons.reduce((n, s) => n + (s.durationMin ?? 0), 0);
            return (
              <li key={t.id}>
                <Link href={`/courses/${t.id}`} data-theme={t.id} className="tile tile-press flex min-h-[5.25rem] items-center gap-4 overflow-hidden py-3 pl-5 pr-4">
                  <span className="grid flex-1 gap-0.5">
                    <span className="display display-s">{THEMES[t.id].name}</span>
                    <span className="meta tabular">
                      {done}/{t.lessons.length} cours · {formatMinutes(minutes)}
                    </span>
                  </span>
                  <span className="tile-th grid size-14 flex-none place-items-center rounded-full">
                    <ThemeGlyph theme={t.id} size={26} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-3" aria-labelledby="play">
        <h2 id="play" className="font-semibold text-muted">Autrement</h2>
        <Link href="/jeu" className="tile tile-press flex min-h-[5.25rem] items-center gap-4 py-3 pl-5 pr-4">
          <span className="grid flex-1 gap-1">
            <span className="flex items-center gap-2">
              <span className="display display-s">L&apos;atelier du prompt</span>
              <span className="beta">bêta</span>
            </span>
            <span className="meta">Un mini-jeu : assemble la bonne demande</span>
          </span>
          <span className="grid size-14 flex-none place-items-center rounded-full bg-lilac text-ink shadow-[inset_0_-4px_0_var(--lilac-deep)]">
            <Puzzle className="size-7" strokeWidth={2.2} aria-hidden />
          </span>
        </Link>
      </section>
    </div>
  );
}

function Featured({ title, line, href, cta, track }: { title: string; line: string; href: string; cta: string; track: "bird" | "gecko" | "fox" }) {
  return (
    <section className="tile-accent tile relative grid gap-4 overflow-hidden p-6 pr-28 sm:pr-40">
      <div className="grid gap-1.5">
        <h2 className="display display-m">{title}</h2>
        {line && <p className="line-clamp-2 max-w-[34ch] text-[0.9375rem]">{line}</p>}
      </div>
      <Link href={href} className="btn w-fit bg-surface text-ink shadow-[0_3px_0_var(--accent-deep)]">
        {cta}
        <ChevronRight className="size-5" aria-hidden />
      </Link>
      <span className="absolute -bottom-3 right-3 sm:right-6" aria-hidden>
        <Avatar track={track} size={112} mood="happy" animate decorative />
      </span>
    </section>
  );
}
