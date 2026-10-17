"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import type { TrackId } from "@/content/types";
import { saveOnboarding, type PlacementAnswer } from "@/lib/onboardingStorage";
import type { Goal } from "@/lib/goals";
import { gaugeSegments, suggestTrack } from "@/lib/placementFlow";
import type { Guide } from "./HeroScene";
import type { PlacementResult } from "./PlacementRun";

// The question bank (and its answers) lives in PlacementRun: it is downloaded only when someone starts the test.
const PlacementRun = dynamic(() => import("./PlacementRun"), {
  ssr: false,
  loading: () => <p className="text-muted" role="status">Je prépare tes questions…</p>,
});

const GOALS: { id: Goal; title: string; hint: string }[] = [
  { id: "discover", title: "Comprendre ce qu'est l'IA", hint: "Je débute ou presque : je veux savoir comment ça marche et m'en servir sans risque." },
  { id: "practice", title: "M'en servir pour étudier ou travailler", hint: "J'utilise déjà un assistant, je veux de meilleurs résultats et des méthodes." },
  { id: "build", title: "Construire avec l'IA", hint: "API, agents, RAG, code : je veux concevoir de vrais systèmes." },
];

const TRACK_COLOR: Record<TrackId, string> = { bird: "var(--bird)", gecko: "var(--gecko)", fox: "var(--fox)" };
const TRACK_TITLE: Record<TrackId, string> = { bird: "Repartir de zéro", gecko: "Étudier et travailler mieux", fox: "Brancher l'IA à tes outils" };
const TRACK_PITCH: Record<TrackId, string> = {
  bird: "Comprendre ce que fait une IA, écrire tes premiers prompts, éviter les pièges.",
  gecko: "Réviser, rédiger, vérifier, automatiser ton quotidien.",
  fox: "API, agents, MCP, RAG : concevoir de vrais systèmes.",
};
type Stage = "intro" | "goal" | "test" | "result";

/**
 * "Par où commencer ?": the real level test inside the landing page, or a direct choice of track.
 * Both end the same way: the answers are stored for /signup, which re-grades them on the server.
 */
export function LandingPlacement({ guides }: { guides: Guide[] }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [picked, setPicked] = useState<TrackId | null>(null);
  const [direct, setDirect] = useState(false);

  const level10 = result?.level10 ?? 0;
  const answers: PlacementAnswer[] = result?.answers ?? [];
  const suggested = suggestTrack(goal, level10);
  const nameOf = (id: TrackId) => guides.find((g) => g.id === id)?.name ?? id;

  function restart() {
    setResult(null);
    setPicked(null);
    setDirect(false);
    setGoal(null);
    setStage("intro");
  }

  function chooseDirect(id: TrackId) {
    setDirect(true);
    setPicked(id);
    setResult(null);
    setGoal(null);
    setStage("intro");
  }

  function goSignup(id: TrackId) {
    saveOnboarding({ placement: answers, goal, track: id });
    router.push(`/signup?track=${id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-start lg:gap-8">
      <div id="test" className="tile grid min-h-[26rem] content-start gap-6 p-6 sm:p-8">
        {stage === "intro" && (
          <div className="fade-in grid justify-items-start gap-4">
            <p className="hand text-ink-2">le test s&apos;adapte à chaque réponse</p>
            <h3 className="display display-m">Dis-moi où j&apos;en suis</h3>
            <p className="max-w-[46ch]">Si tu réponds juste, la question suivante est plus difficile. Si tu te trompes, elle devient plus simple. À la fin : un niveau sur 10 et le parcours qui te correspond. Tu peux toujours en choisir un autre.</p>
            <button className="btn btn-primary btn-lg" onClick={() => setStage("goal")}>Commencer le test</button>
            <p className="text-sm text-muted">Pas de correction pendant le test, et « Je ne sais pas » est une réponse valable.</p>
          </div>
        )}

        {stage === "goal" && (
          <div className="fade-in grid gap-5">
            <h3 className="display display-m">Qu&apos;est-ce que tu veux faire avec l&apos;IA ?</h3>
            <div className="grid gap-3" role="radiogroup" aria-label="Ton objectif">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  role="radio"
                  aria-checked={goal === g.id}
                  className="choice !min-h-16"
                  onClick={() => {
                    setGoal(g.id);
                    window.setTimeout(() => setStage("test"), 180);
                  }}
                >
                  <span className="grid gap-0.5">
                    <span className="text-lg font-semibold">{g.title}</span>
                    <span className="text-[0.9375rem] text-muted">{g.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "test" && (
          <PlacementRun
            onDone={(r) => {
              setResult(r);
              setStage("result");
            }}
          />
        )}

        {stage === "result" && (
          <div className="fade-in grid justify-items-start gap-5">
            <p className="eyebrow">Ton point de départ</p>
            <p className="display text-[clamp(3.5rem,9vw,6rem)] leading-[0.9]">
              <span className="sr-only">Ton niveau estimé : </span>
              {level10}
              <span className="text-muted">/10</span>
            </p>
            <div className="flex w-full max-w-md gap-1" aria-hidden>
              {gaugeSegments(level10).map((s) => (
                <i key={s.index} className="h-3 flex-1 rounded-full bg-sunk transition-colors duration-500" style={s.filled ? { background: TRACK_COLOR[s.track], transitionDelay: `${s.index * 45}ms` } : undefined} />
              ))}
            </div>
            <p className="max-w-[46ch]">
              <strong>{result?.levelLabel}.</strong> Un point de départ, pas une note : tout reste ouvert, à ton rythme.
            </p>
            <p className="font-semibold">Ton parcours</p>
            <div className="grid w-full gap-2" role="radiogroup" aria-label="Ton parcours">
              {[suggested, ...guides.map((g) => g.id).filter((id) => id !== suggested)].map((id) => {
                const selected = (picked ?? suggested) === id;
                const g = guides.find((x) => x.id === id);
                return (
                  <button key={id} role="radio" aria-checked={selected} data-track={id} className={`tile tile-press flex items-center gap-4 p-3 text-left ${selected ? "tile-accent" : ""}`} onClick={() => setPicked(id)}>
                    <span className="grid size-14 flex-none place-items-center rounded-2xl bg-surface">
                      <Avatar track={id} size={44} mood={selected ? "cheer" : "happy"} />
                    </span>
                    <span className="grid min-w-0 flex-1">
                      <span className="display display-s">{nameOf(id)}</span>
                      <span className="text-sm font-medium">
                        {g?.audience}
                        {id === suggested && " · Conseillé pour toi"}
                      </span>
                    </span>
                    {selected && <Check className="size-5 flex-none" strokeWidth={3} aria-hidden />}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary" onClick={() => goSignup(picked ?? suggested)}>
                Créer mon compte et commencer
              </button>
              <button className="btn btn-ghost" onClick={restart}>
                Refaire le test
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <p className="eyebrow">Ou choisis ton parcours</p>
        {guides.map((g) => (
          <button
            key={g.id}
            data-track={g.id}
            aria-pressed={direct && picked === g.id}
            onClick={() => chooseDirect(g.id)}
            className="tile tile-accent tile-press grid grid-cols-[4.5rem_1fr] items-center gap-4 p-4 text-left aria-pressed:outline aria-pressed:outline-[3px] aria-pressed:outline-offset-[3px] aria-pressed:outline-ink"
          >
            <span className="grid size-[4.5rem] place-items-center rounded-2xl bg-surface">
              <Avatar track={g.id} size={56} />
            </span>
            <span className="grid gap-0.5">
              <span className="text-sm font-semibold">
                {g.name} · {g.lessons} cours
              </span>
              <span className="display display-s">{TRACK_TITLE[g.id]}</span>
              <span className="text-[0.9375rem] leading-snug">{TRACK_PITCH[g.id]}</span>
            </span>
          </button>
        ))}
        {direct && picked && (
          <div className="fade-in tile grid gap-3 p-5" role="status" data-track={picked}>
            <p className="display display-s">Tu pars sur {nameOf(picked)}.</p>
            <div>
              <button className="btn btn-primary" onClick={() => goSignup(picked)}>
                Créer mon compte et commencer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
