"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, TriangleAlert, X } from "lucide-react";
import { chooseTrack } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import type { TrackId } from "@/content/types";

export type TrackSummary = { id: TrackId; name: string; audience: string; done: number; total: number };

/**
 * The mascot at the top of the path doubles as the track switch. Changing keeps all progress, but the sheet
 * says plainly that switching mid-chapter breaks the rhythm, and when the last test pointed elsewhere.
 */
export function TrackSwitcher({ current, tracks, chapterName, testedTrack }: { current: TrackId; tracks: TrackSummary[]; chapterName: string | null; testedTrack: TrackId | null }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<TrackId | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const me = tracks.find((t) => t.id === current)!;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    dialog.current?.querySelector<HTMLElement>("button, a")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const picked = target ? tracks.find((t) => t.id === target) : null;

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-1 rounded-2xl p-1 pr-2 transition-colors hover:bg-sunk"
        onClick={() => {
          setTarget(null);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-label={`Parcours ${me.name}. Changer de parcours`}
      >
        <span className="grid size-11 place-items-center rounded-xl bg-accent shadow-[0_3px_0_var(--accent-deep)]">
          <Avatar track={current} size={36} decorative />
        </span>
        <ChevronDown className="size-4 text-muted" strokeWidth={2.6} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="switch-title">
          <button className="absolute inset-0 bg-ink/35" aria-label="Fermer" tabIndex={-1} onClick={() => setOpen(false)} />
          <div ref={dialog} className="sheet-in relative grid w-full max-w-md gap-5 rounded-t-3xl bg-paper p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="switch-title" className="display display-s">{picked ? `Passer sur ${picked.name} ?` : "Ton parcours"}</h2>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Fermer"><X className="size-5" aria-hidden /></button>
            </div>

            {!picked ? (
              <>
                <ul className="grid gap-2.5">
                  {tracks.map((t) => (
                    <li key={t.id} data-track={t.id}>
                      <button
                        type="button"
                        className="choice !gap-3"
                        aria-current={t.id === current ? "true" : undefined}
                        onClick={() => (t.id === current ? setOpen(false) : setTarget(t.id))}
                      >
                        <span className="grid size-12 flex-none place-items-center rounded-xl bg-accent-soft"><Avatar track={t.id} size={40} decorative /></span>
                        <span className="grid flex-1 gap-0.5">
                          <span className="font-semibold">{t.name}</span>
                          <span className="text-sm text-muted">{t.audience} · {t.done}/{t.total} cours</span>
                        </span>
                        {t.id === current && <Check className="size-5 flex-none" strokeWidth={3} aria-label="Ton parcours" />}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-ink-2">
                  Ton niveau a changé ? <Link href={`/onboarding?track=${current}`} className="font-semibold text-ink underline">Refaire le test {me.name}</Link>
                </p>
              </>
            ) : (
              <div className="grid gap-4" data-track={picked.id}>
                <div className="flex items-center gap-4">
                  <Avatar track={picked.id} size={64} mood="wow" decorative />
                  <p className="text-ink-2">Ta progression est gardée sur chaque parcours. Tu peux revenir quand tu veux.</p>
                </div>
                {chapterName && (
                  <p className="flex gap-2.5 rounded-2xl bg-bird-soft p-3.5 text-[0.9375rem]">
                    <TriangleAlert className="mt-0.5 size-5 flex-none" aria-hidden />
                    <span>Changer en plein chapitre casse le rythme. Le mieux : finir « {chapterName} » d&apos;abord.</span>
                  </p>
                )}
                {testedTrack && testedTrack !== picked.id && (
                  <p className="text-[0.9375rem] text-ink-2">Ton dernier test portait sur {tracks.find((t) => t.id === testedTrack)?.name}.</p>
                )}
                <form action={chooseTrack} className="flex flex-wrap gap-3">
                  <input type="hidden" name="track" value={picked.id} />
                  <button className="btn btn-primary">Passer sur {picked.name}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Rester sur {me.name}</button>
                </form>
                {picked.done === 0 && (
                  <p className="text-sm text-muted">
                    Tu débutes là-bas. <Link href={`/onboarding?track=${picked.id}`} className="font-semibold text-ink underline">Passer le test {picked.name}</Link> pour sauter ce que tu sais.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
