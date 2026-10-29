"use client";

import { useRef, useState } from "react";
import { Flag } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import type { ThemeId, TrackId } from "@/content/types";
import type { LandingPlan, LandingTrack } from "@/lib/landingBoard";

const TRACKS: TrackId[] = ["bird", "gecko", "fox"];

/** What each guide says: a situation the visitor may recognise. */
const SAYS: Record<TrackId, string> = {
  bird: "Je n'ai jamais vraiment osé lui écrire.",
  gecko: "Je m'en sers, mais je tombe souvent à côté.",
  fox: "Je veux la brancher à mes outils.",
};

/**
 * Ten theme tiles, then the three tracks side by side, each on its own colour with its own guide.
 * Every lesson is a dot in the colour of its theme; touching a theme lights its lessons in all three tracks.
 */
export function ThemePlan({ plan }: { plan: LandingPlan }) {
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const [mobileTrack, setMobileTrack] = useState<TrackId>("bird");
  const planRef = useRef<HTMLElement>(null);

  function pickTheme(id: ThemeId) {
    const next = theme === id ? null : id;
    setTheme(next);
    if (!next) return;
    const first = TRACKS.find((t) => plan.tracks[t].chapters.some((c) => c.lessons.some((l) => l.theme === next)));
    if (first && !plan.tracks[mobileTrack].chapters.some((c) => c.lessons.some((l) => l.theme === next))) setMobileTrack(first);
    planRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <section id="themes" className="mx-auto max-w-[90rem] scroll-mt-6 px-4 py-20 sm:px-8 lg:py-28">
        <div className="mb-10 grid max-w-[40rem] gap-3">
          <h2 className="display display-l">De la première question au projet complet.</h2>
          <p className="lede">Dix thèmes. Touche-en un pour voir où il apparaît dans les parcours.</p>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Les dix thèmes">
          {plan.themes.map((t) => (
            <li key={t.id} className="contents">
              <button type="button" data-theme={t.id} aria-pressed={theme === t.id} onClick={() => pickTheme(t.id)} className="tile-th tile tile-press grid min-h-40 content-center justify-items-center gap-2 p-4 text-center aria-pressed:outline aria-pressed:outline-[3px] aria-pressed:outline-offset-[3px] aria-pressed:outline-ink">
                <span className="grid size-11 place-items-center rounded-full bg-surface text-ink">
                  <ThemeGlyph theme={t.id} size={22} />
                </span>
                <span className="display display-xs">{t.name}</span>
                <span className="text-[0.8125rem] leading-snug">{t.pitch}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="plan" ref={planRef} className="scroll-mt-0 bg-sky-soft">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-28">
          <div className="mb-8 grid max-w-[44rem] gap-3">
            <h2 className="display display-l">Trois parcours, trois chemins.</h2>
            <p className="lede">Chacun a son guide, ses chapitres et ses cours. Tu en suis un seul, à ton niveau.</p>
          </div>

          <div className="mb-5 flex gap-2 md:hidden" role="tablist" aria-label="Parcours">
            {TRACKS.map((t) => (
              <button key={t} role="tab" type="button" data-track={t} aria-selected={mobileTrack === t} aria-controls={`plan-${t}`} onClick={() => setMobileTrack(t)} className="plan-tab">
                <Avatar track={t} size={28} decorative />
                {plan.tracks[t].name}
              </button>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {TRACKS.map((t) => (
              <TrackColumn key={t} track={plan.tracks[t]} theme={theme} hiddenOnMobile={mobileTrack !== t} />
            ))}
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
            <span className="inline-flex items-center gap-1.5"><i className="plan-dot" data-theme="prompt" aria-hidden /> un cours, couleur de son thème</span>
            <span className="inline-flex items-center gap-1.5"><Flag className="size-3.5" aria-hidden /> projet final</span>
            {theme && (
              <button type="button" onClick={() => setTheme(null)} className="font-semibold text-ink underline">
                Afficher tous les thèmes
              </button>
            )}
          </p>
        </div>
      </section>
    </>
  );
}

function TrackColumn({ track, theme, hiddenOnMobile }: { track: LandingTrack; theme: ThemeId | null; hiddenOnMobile: boolean }) {
  const [shown, setShown] = useState<string | null>(null);
  const all = track.chapters.flatMap((c) => c.lessons);
  const label = all.find((l) => l.id === shown);
  return (
    <article id={`plan-${track.track}`} data-track={track.track} className={`plan-col ${hiddenOnMobile ? "max-md:hidden" : ""}`} aria-label={`Parcours ${track.name}`}>
      <header className="flex items-end gap-3">
        <Avatar track={track.track} size={64} animate />
        <p className="bubble mb-3 text-[0.875rem]">{SAYS[track.track]}</p>
      </header>
      <div className="grid gap-0.5">
        <h3 className="display display-m">{track.name}</h3>
        <p className="text-sm font-semibold">{track.animal} · {track.audience} · {track.lessons} cours</p>
      </div>
      <ol className="plan-chapters">
        {track.chapters.map((c, i) => (
          <li key={c.id}>
            <span className="plan-num" aria-hidden>{c.project ? <Flag className="size-3.5" /> : i + 1}</span>
            <span className="grid gap-1.5">
              <span className="text-[0.9375rem] font-semibold leading-tight">{c.name}</span>
              <span className="flex flex-wrap gap-1.5">
                {c.lessons.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    data-theme={l.theme}
                    className="plan-dot"
                    data-dim={theme !== null && l.theme !== theme ? "" : undefined}
                    aria-label={l.title}
                    aria-pressed={shown === l.id}
                    onClick={() => setShown(shown === l.id ? null : l.id)}
                    onMouseEnter={() => setShown(l.id)}
                  />
                ))}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="min-h-10 text-sm" aria-live="polite">
        {label ? <><strong>{label.title}</strong> · {label.minutes} min</> : <span className="text-ink-2">Touche une pastille pour voir le cours.</span>}
      </p>
    </article>
  );
}
