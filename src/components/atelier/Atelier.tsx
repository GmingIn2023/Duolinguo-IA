"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, RotateCcw, Send, Star, X } from "lucide-react";
import type { TrackId } from "@/content/types";
import { KIND_LABEL, canSend, dealCards, gradeMission, likelyAnswer, maxCards, toggleCard, type AtelierCard, type CardKind, type Mission, type MissionResult } from "@/lib/atelier";
import { playSound } from "@/lib/sound";
import { Avatar } from "@/components/Avatar";

const KIND_TONE: Record<CardKind, string> = {
  role: "var(--lilac-soft)",
  contexte: "var(--sky-soft)",
  tache: "var(--bird-soft)",
  format: "var(--gecko-soft)",
  limite: "var(--fox-soft)",
};

/** The best score on this device, kept as a small convenience: nothing breaks without it. */
function readBest(track: TrackId): number | null {
  try {
    const stored = typeof window === "undefined" ? null : window.localStorage.getItem(`atelier-best-${track}`);
    return stored ? Number(stored) : null;
  } catch {
    return null;
  }
}

const VERDICT = { 3: "Demande parfaite !", 2: "Presque !", 1: "Il manque l'essentiel" } as const;

function KindTag({ kind }: { kind: CardKind }) {
  return (
    <span className="inline-flex h-6 flex-none items-center rounded-full px-2 text-xs font-bold text-ink" style={{ background: KIND_TONE[kind] }}>
      {KIND_LABEL[kind]}
    </span>
  );
}

function Stars({ count, size = 28 }: { count: number; size?: number }) {
  return (
    <span className="flex gap-1" role="img" aria-label={`${count} étoile${count > 1 ? "s" : ""} sur 3`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= count ? "fill-bird text-bird-deep" : "fill-sunk text-line"} strokeWidth={2} aria-hidden />
      ))}
    </span>
  );
}

/** One session of the prompt workshop: four missions, then the stars. */
export function Atelier({ track, missions, sounds, motion }: { track: TrackId; missions: Mission[]; sounds: boolean; motion: "full" | "calm" }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<MissionResult | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [best, setBest] = useState<number | null>(() => readBest(track));
  const [bump, setBump] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  const done = scores.length === missions.length && !result;
  const mission = missions[Math.min(index, missions.length - 1)];
  const cards = useMemo(() => dealCards(mission), [mission]);
  const limit = maxCards(mission);
  const answer = likelyAnswer(mission, picked);
  const byId = (id: string) => mission.cards.find((c) => c.id === id) as AtelierCard;
  const total = scores.reduce((n, s) => n + s, 0);
  const progress = scores.length / missions.length;

  useEffect(() => {
    if (!done) return;
    if (sounds) playSound("done");
    try {
      const prev = Number(window.localStorage.getItem(`atelier-best-${track}`) ?? 0);
      if (total > prev) window.localStorage.setItem(`atelier-best-${track}`, String(total));
    } catch {
      // storage blocked: the score simply isn't kept
    }
  }, [done, sounds, total, track]);

  function pick(id: string) {
    const next = toggleCard(mission, picked, id);
    if (next === picked) setBump((n) => n + 1);
    setPicked(next);
  }

  function send() {
    const r = gradeMission(mission, picked);
    if (sounds) playSound(r.stars === 1 ? "wrong" : "right");
    setResult(r);
    setScores((s) => [...s, r.stars]);
  }

  function next() {
    setResult(null);
    setPicked([]);
    setIndex((i) => i + 1);
    top.current?.scrollIntoView({ block: "start" });
  }

  function replay() {
    setScores([]);
    setIndex(0);
    setPicked([]);
    setResult(null);
    setBest(readBest(track));
  }

  return (
    <div data-track={track} data-motion={motion} className="atelier min-h-dvh" ref={top}>
      <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/courses" className="icon-btn hover:bg-sunk" aria-label="Quitter l'atelier">
            <X className="size-6" aria-hidden />
          </Link>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-label="Missions terminées" aria-valuenow={scores.length} aria-valuemin={0} aria-valuemax={missions.length}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${Math.max(progress, 0.02) * 100}%`, boxShadow: "inset 0 -3px 0 var(--accent-deep)" }} />
          </div>
          <span className="beta">bêta</span>
        </div>
      </header>

      {done ? (
        <main className="page-in mx-auto grid max-w-md justify-items-center gap-6 px-4 py-10 text-center">
          <Avatar track={track} mood={total >= missions.length * 2.5 ? "cheer" : total >= missions.length * 2 ? "happy" : "think"} size={150} animate />
          <div className="grid gap-2">
            <h1 className="display display-l">Atelier terminé</h1>
            <p className="lede mx-auto">
              <strong className="tabular text-ink">{total}</strong> étoiles sur {missions.length * 3}
              {best !== null && total > best ? ". Nouveau record !" : best ? `. Ton record : ${best}.` : "."}
            </p>
          </div>
          <ul className="grid w-full gap-2">
            {missions.map((m, i) => (
              <li key={m.id} className="tile flex items-center justify-between gap-3 px-4 py-3 text-left">
                <span className="font-semibold">{m.title}</span>
                <Stars count={scores[i] ?? 0} size={20} />
              </li>
            ))}
          </ul>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" className="btn btn-primary" onClick={replay}>
              <RotateCcw className="size-5" aria-hidden />
              Rejouer
            </button>
            <Link href="/courses" className="btn btn-secondary">Retour aux cours</Link>
          </div>
        </main>
      ) : (
        <main key={mission.id} className="page-in mx-auto grid max-w-3xl gap-7 px-4 pb-44 pt-4 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-x-8">
          <section className="flex items-end gap-3 lg:col-span-2">
            <Avatar track={track} mood={result ? (result.stars === 3 ? "cheer" : result.stars === 2 ? "happy" : "oops") : "think"} size={76} animate decorative className="flex-none" />
            <h1 className="display display-m pb-1">
              <span className="sr-only">Mission {index + 1} sur {missions.length} : </span>
              {mission.title}
            </h1>
          </section>
          <p className="bubble -mt-3 max-w-[52ch] text-base font-medium lg:col-span-2">{mission.brief}</p>

          <div className="grid gap-7">
            <section className="grid gap-3 max-lg:hidden" aria-labelledby="hand">
              <h2 id="hand" className="display display-xs">Ta demande</h2>
              <div className="tile grid min-h-24 content-start gap-2 p-4">
                {picked.length ? (
                  picked.map((id) => {
                    const c = byId(id);
                    return (
                      <p key={id} className="fade-in flex items-start gap-2 text-[0.9375rem] leading-snug">
                        <KindTag kind={c.kind} />
                        <span className="pt-0.5">{c.text}</span>
                      </p>
                    );
                  })
                ) : (
                  <p className="text-muted">Touche des cartes pour composer ta demande.</p>
                )}
              </div>
            </section>

            <section className="grid gap-3" aria-labelledby="deck">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="deck" className="display display-xs">Choisis tes cartes</h2>
                <p key={bump} className={`meta tabular ${bump ? "shake" : ""}`} aria-live="polite">
                  {picked.length}/{limit} cartes
                </p>
              </div>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {cards.map((c) => {
                  const on = picked.includes(c.id);
                  const state = result ? (c.effect === "trap" && on ? "wrong" : c.effect === "key" ? "correct" : undefined) : undefined;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="choice h-full flex-col items-start gap-2"
                        aria-pressed={on}
                        data-state={state}
                        disabled={!!result}
                        onClick={() => pick(c.id)}
                      >
                        <KindTag kind={c.kind} />
                        <span className="text-[0.9375rem] leading-snug">{c.text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <section id="reponse" className="grid scroll-mt-20 gap-3 lg:sticky lg:top-20" aria-labelledby="answer">
            <h2 id="answer" className="display display-xs">La réponse probable</h2>
            <div className="tile-sunk tile grid gap-3 p-4" aria-live="polite">
              {answer.lines.length || answer.notes.length ? (
                <>
                  {answer.lines.length > 0 && (
                    <div className="grid gap-2 rounded-2xl rounded-tl-md bg-surface p-4 text-[0.9375rem] leading-relaxed shadow-[0_3px_0_var(--edge)]">
                      {answer.lines.map((line) => (
                        <p key={line} className="fade-in">{line}</p>
                      ))}
                    </div>
                  )}
                  {answer.notes.map((note) => (
                    <p key={note} className="fade-in text-sm font-medium text-ink-2">{note}</p>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted">La réponse change à chaque carte que tu ajoutes.</p>
              )}
            </div>
          </section>
        </main>
      )}

      {!done && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] ${result ? `sheet-in border-transparent ${result.stars === 3 ? "bg-good-soft" : result.stars === 2 ? "bg-bird-soft" : "bg-bad-soft"}` : "border-line bg-paper"}`}
          role={result ? "status" : undefined}
          aria-live="polite"
        >
          <div className={`mx-auto flex max-w-3xl gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between ${result ? "flex-col" : "flex-row"}`}>
            {result ? (
              <div className="grid max-h-[42dvh] gap-3 overflow-y-auto">
                <div className="flex items-center gap-3">
                  <Stars count={result.stars} />
                  <p className="text-xl font-bold">{VERDICT[result.stars]}</p>
                </div>
                <ul className="grid gap-2 text-[0.9375rem]">
                  {result.missing.map((c) => (
                    <li key={c.id}>
                      <span className="font-semibold">Il manquait « {c.text} »</span> <span className="text-ink-2">{c.why}</span>
                    </li>
                  ))}
                  {result.traps.map((c) => (
                    <li key={c.id}>
                      <span className="font-semibold text-bad">Piège : « {c.text} »</span> <span className="text-ink-2">{c.why}</span>
                    </li>
                  ))}
                  {result.others.map((c) => (
                    <li key={c.id}>
                      <span className="font-semibold">« {c.text} »</span> <span className="text-ink-2">{c.why}</span>
                    </li>
                  ))}
                  {result.stars === 3 && !result.others.length && <li className="text-ink-2">Toutes les cartes utiles, aucun piège.</li>}
                </ul>
              </div>
            ) : (
              <p className="meta max-lg:hidden">{canSend(mission, picked) ? "Prêt ? Envoie ta demande." : "Ajoute au moins une carte Tâche."}</p>
            )}
            {!result && (
              <a href="#reponse" className="btn btn-secondary btn-lg flex-none px-0 max-sm:w-[3.75rem] sm:px-6 lg:hidden" aria-label="Voir la réponse probable">
                <Eye className="size-5" aria-hidden />
                <span className="max-sm:sr-only">Voir la réponse</span>
              </a>
            )}
            {result ? (
              <button type="button" className="btn btn-primary btn-lg btn-block flex-none sm:w-auto" onClick={next}>
                {index + 1 < missions.length ? "Mission suivante" : "Voir le bilan"}
                <ArrowRight className="size-5" aria-hidden />
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg flex-1 sm:w-auto sm:flex-none" disabled={!canSend(mission, picked)} onClick={send}>
                Envoyer la demande
                <Send className="size-5" aria-hidden />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
