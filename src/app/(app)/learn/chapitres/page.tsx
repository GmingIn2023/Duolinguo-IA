import type { Metadata } from "next";
import Link from "next/link";
import { Check, Lock, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { TRACKS, getLesson } from "@/content";
import { getKnowledge, getResume, requireViewer } from "@/lib/data";
import { formatMinutes } from "@/lib/labels";
import { trackPath } from "@/lib/path";
import { NEXT_TRACK } from "@/lib/placementRules";

export const metadata: Metadata = { title: "Chapitres" };

/** The whole track at a glance, chapter by chapter, top to bottom. A chapter opens the path at that point. */
export default async function ChaptersPage() {
  const { profile } = await requireViewer();
  const trackId = profile.track_id ?? "bird";
  const [{ knowledge }, resume] = await Promise.all([getKnowledge(), getResume()]);
  const track = TRACKS[trackId];
  const path = trackPath(track, knowledge, getLesson, resume);
  const next = NEXT_TRACK[trackId];

  return (
    <div className="mx-auto grid max-w-xl gap-6" data-track={trackId}>
      <header className="flex items-center gap-3">
        <Link href="/learn" className="icon-btn" aria-label="Retour au chemin"><X className="size-6" aria-hidden /></Link>
        <h1 className="display display-m flex-1 text-center">{track.name}</h1>
        <span className="w-11" aria-hidden />
      </header>

      <ol className="grid gap-5">
        {path.chapters.map((c) => {
          const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
          const minutes = c.steps.filter((s) => s.lessonId && s.status !== "completed" && s.status !== "covered").reduce((n, s) => n + (s.durationMin ?? 0), 0);
          const body = (
            <article className="chapter-card" data-status={c.status}>
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <h2 className="display display-m">{c.chapter.project ? "Projet" : `Chapitre ${c.index + 1}`}</h2>
                  <p className="font-semibold">{c.chapter.name}</p>
                </div>
                <span className="chip !min-h-8 flex-none !px-3 tabular">
                  {c.status === "locked" ? <Lock className="size-3.5" aria-hidden /> : c.status === "done" ? <Check className="size-4 text-good" strokeWidth={3} aria-hidden /> : null}
                  {c.done}/{c.total} cours
                </span>
              </div>
              {c.status === "current" ? (
                <div className="flex items-end gap-3">
                  <p className="bubble flex-1 !font-medium">{c.chapter.blurb}</p>
                  <Avatar track={trackId} size={84} animate decorative />
                </div>
              ) : (
                <p className="text-[0.9375rem] text-ink-2">
                  {c.status === "locked" ? `Termine d'abord « ${c.lockedBy} ».` : c.chapter.blurb}
                </p>
              )}
              <div className="grid gap-1.5">
                <div className="chapter-bar" role="progressbar" aria-label={`Avancement du chapitre ${c.index + 1}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  {pct > 0 && <span style={{ width: `${Math.max(pct, 6)}%` }} />}
                </div>
                <p className="meta">
                  {c.status === "done" ? (c.validatedByTest ? "Validé par ton test" : "Terminé") : minutes ? `Encore ${formatMinutes(minutes)} environ` : ""}
                </p>
              </div>
            </article>
          );
          return (
            <li key={c.chapter.id} className="chapter-link">
              {c.status === "locked" ? body : <Link href={`/learn#ch-${c.chapter.id}`} className="block rounded-[20px] transition-transform hover:-translate-y-0.5">{body}</Link>}
            </li>
          );
        })}
      </ol>

      {next && (
        <Link href={`/onboarding?track=${next}`} data-track={next} className="tile-sunk tile flex items-center gap-4 p-4">
          <Avatar track={next} size={52} mood="sleep" decorative />
          <span className="grid gap-0.5">
            <span className="font-semibold text-ink">Ensuite : {TRACKS[next].name}</span>
            <span className="text-sm">Passe son test quand tu te sens prêt.</span>
          </span>
        </Link>
      )}
    </div>
  );
}
