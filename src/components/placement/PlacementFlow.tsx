"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { chooseTrack, savePlacement } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { TRACKS, TRACK_IDS } from "@/content/curriculum";
import type { TrackId } from "@/content/types";
import { TRACK_FOR_GOAL, type Goal } from "@/lib/goals";
import { saveOnboarding } from "@/lib/onboardingStorage";
import { levelName, placementVerdict } from "@/lib/placementRules";
import type { PlacementResult } from "./PlacementRun";

// The question bank (and its answers) is downloaded only when a test starts.
const PlacementRun = dynamic(() => import("./PlacementRun"), {
  ssr: false,
  loading: () => <p className="text-muted" role="status">Je prépare tes questions…</p>,
});

const GOALS: { id: Goal; title: string; hint: string }[] = [
  { id: "discover", title: "Comprendre ce qu'est l'IA", hint: "Je débute, ou presque." },
  { id: "practice", title: "M'en servir pour étudier ou travailler", hint: "J'utilise déjà un assistant, je veux mieux faire." },
  { id: "build", title: "Construire avec l'IA", hint: "API, agents, RAG, code." },
];

type Stage = "goal" | "test" | "result";

/**
 * "Où j'en suis ?": a goal, then the test of the matching track, then a result that says where to start.
 * The same flow runs inside the landing page and on /onboarding (also for a signed-in retake).
 */
export function PlacementFlow({
  signedIn,
  initialTrack = null,
  compact = false,
  onStage,
}: {
  signedIn: boolean;
  /** Skips the goal question (a retake, or "take the Gecko test" from a result). */
  initialTrack?: TrackId | null;
  compact?: boolean;
  onStage?: (stage: Stage, progress: number) => void;
}) {
  const [stage, setStageState] = useState<Stage>(initialTrack ? "test" : "goal");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tested, setTested] = useState<TrackId>(initialTrack ?? "bird");
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [run, setRun] = useState(0);

  const setStage = (s: Stage) => {
    setStageState(s);
    onStage?.(s, s === "goal" ? 0 : s === "test" ? 0.5 : 1);
  };

  function startTest(track: TrackId) {
    setTested(track);
    setResult(null);
    setRun((r) => r + 1);
    setStage("test");
  }

  return (
    <div className="grid gap-6">
      {stage === "goal" && (
        <div className="fade-in grid gap-5">
          <h3 className={`display ${compact ? "display-m" : "display-l"}`}>Qu&apos;est-ce que tu veux faire avec l&apos;IA ?</h3>
          <p className="text-ink-2">Ta réponse choisit le test : 10 questions sur ce parcours, environ 3 minutes.</p>
          <div className="grid gap-3" role="radiogroup" aria-label="Ton objectif">
            {GOALS.map((g) => (
              <button
                key={g.id}
                role="radio"
                aria-checked={goal === g.id}
                data-track={TRACK_FOR_GOAL[g.id]}
                className="choice !min-h-[4.5rem] !gap-4"
                onClick={() => {
                  setGoal(g.id);
                  window.setTimeout(() => startTest(TRACK_FOR_GOAL[g.id]), 180);
                }}
              >
                <span className="grid size-12 flex-none place-items-center rounded-2xl bg-accent-soft">
                  <Avatar track={TRACK_FOR_GOAL[g.id]} size={40} decorative />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-lg font-semibold leading-tight">{g.title}</span>
                  <span className="text-[0.9375rem] text-muted">{g.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "test" && (
        <PlacementRun
          key={run}
          track={tested}
          compact={compact}
          onDone={(r) => {
            setResult(r);
            setStage("result");
          }}
        />
      )}

      {stage === "result" && result && (
        <PlacementResultView key={`${run}-${result.track}`} result={result} goal={goal} signedIn={signedIn} compact={compact} onTest={startTest} />
      )}
    </div>
  );
}

function PlacementResultView({
  result,
  goal,
  signedIn,
  compact,
  onTest,
}: {
  result: PlacementResult;
  goal: Goal | null;
  signedIn: boolean;
  compact: boolean;
  onTest: (track: TrackId) => void;
}) {
  const router = useRouter();
  const tested = result.track;
  const track = TRACKS[tested];
  const verdict = placementVerdict(tested, result);
  const [stay, setStay] = useState(false);
  const [chosen, setChosen] = useState<TrackId>(tested);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const startChapter = track.chapters.find((c) => !result.chapters.includes(c.id));
  const startIndex = startChapter ? track.chapters.indexOf(startChapter) + 1 : track.chapters.length;
  const advise = !stay && verdict.kind !== "start";

  function finish() {
    setError(null);
    if (!signedIn) {
      saveOnboarding({ placement: result.answers, goal, tested, track: chosen });
      router.push(`/signup?track=${chosen}`);
      return;
    }
    start(async () => {
      try {
        await savePlacement(tested, result.answers, chosen === tested);
        if (chosen !== tested) {
          const fd = new FormData();
          fd.set("track", chosen);
          await chooseTrack(fd); // redirects to /learn
        }
        router.push("/learn");
      } catch (e) {
        // a redirect is thrown as an error by design: let Next handle it
        if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
        setError("Ton résultat n'a pas été enregistré. Vérifie ta connexion, puis réessaie.");
      }
    });
  }

  return (
    <div className="fade-in grid gap-7" data-track={tested}>
      <div className="flex items-end gap-5">
        <Avatar track={tested} mood={result.score >= 5 ? "cheer" : "happy"} size={compact ? 84 : 104} animate />
        <div className="grid gap-1">
          <p className="display text-[clamp(3.25rem,9vw,5.5rem)] leading-[0.85]">
            <span className="sr-only">Ton score : </span>
            {result.score}
            <span className="text-muted">/10</span>
          </p>
          <p className="font-semibold">
            {levelName(result.score)} · test {track.name}
          </p>
        </div>
      </div>
      <div className="flex w-full max-w-md gap-1" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={`h-3 flex-1 rounded-full transition-colors duration-500 ${i < result.score ? "bg-accent shadow-[inset_0_-2px_0_var(--accent-deep)]" : "bg-sunk"}`} style={{ transitionDelay: `${i * 45}ms` }} />
        ))}
      </div>

      {advise && verdict.kind === "next" && (
        <Advice
          title={`Tu connais déjà l'essentiel de ${track.name}.`}
          body={`Le test ${TRACKS[verdict.track].name} te dira où commencer là-bas.`}
          track={verdict.track}
          cta={`Passer le test ${TRACKS[verdict.track].name}`}
          onCta={() => onTest(verdict.track)}
          other={`Rester sur ${track.name}`}
          onOther={() => setStay(true)}
        />
      )}
      {advise && verdict.kind === "previous" && (
        <Advice
          title={`${track.name} risque d'aller trop vite pour l'instant.`}
          body={`Le test ${TRACKS[verdict.track].name} part de plus près.`}
          track={verdict.track}
          cta={`Passer le test ${TRACKS[verdict.track].name}`}
          onCta={() => onTest(verdict.track)}
          other={`Continuer sur ${track.name}`}
          onOther={() => setStay(true)}
        />
      )}

      {!advise && (
        <>
          <section className="grid gap-3" aria-labelledby="start-here">
            <h4 id="start-here" className="display display-s">
              {startChapter ? `Tu commences au chapitre ${startIndex} : ${startChapter.name}` : "Tout le parcours est validé"}
            </h4>
            <ol className="grid gap-1.5">
              {track.chapters.map((c, i) => {
                const ok = result.chapters.includes(c.id);
                const here = c.id === startChapter?.id;
                return (
                  <li key={c.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${here ? "bg-accent-soft font-semibold" : ""}`}>
                    <span className={`grid size-7 flex-none place-items-center rounded-full text-sm font-bold ${ok ? "bg-good text-white" : here ? "bg-accent shadow-[inset_0_-2px_0_var(--accent-deep)]" : "bg-sunk text-muted"}`}>
                      {ok ? <Check className="size-4" strokeWidth={3.2} aria-hidden /> : i + 1}
                    </span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-sm text-muted">{ok ? "Validé par le test" : here ? "Tu commences ici" : c.project ? "Projet" : ""}</span>
                  </li>
                );
              })}
            </ol>
          </section>

          {chosen !== tested && (
            <div className="fade-in flex gap-3 rounded-2xl bg-bird-soft p-4" role="alert" data-track={chosen}>
              <TriangleAlert className="mt-0.5 size-5 flex-none" aria-hidden />
              <div className="grid gap-2">
                <p>
                  <strong>Ton test portait sur {track.name}.</strong> Sur {TRACKS[chosen].name}, rien n&apos;est validé : tu partiras du chapitre 1.
                </p>
                <button className="w-fit font-semibold underline" onClick={() => setChosen(tested)}>Revenir à {track.name} (conseillé)</button>
              </div>
            </div>
          )}

          {error && <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 font-medium text-bad">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary btn-lg" onClick={finish} disabled={pending} data-track={chosen}>
              {pending ? "Enregistrement…" : signedIn ? (chosen === tested && startChapter ? `Commencer au chapitre ${startIndex}` : "Aller à mon parcours") : "Créer mon compte et commencer"}
            </button>
            <button className="btn btn-ghost" onClick={() => setPicking((p) => !p)} aria-expanded={picking}>
              Choisir un autre parcours
            </button>
          </div>

          {picking && (
            <div className="fade-in grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Ton parcours">
              {TRACK_IDS.map((id) => (
                <button key={id} role="radio" aria-checked={chosen === id} data-track={id} className="choice !gap-3" onClick={() => setChosen(id)}>
                  <Avatar track={id} size={36} decorative />
                  <span className="grid">
                    <span className="font-semibold">{TRACKS[id].name}</span>
                    <span className="text-sm text-muted">{id === tested ? "Ton test" : TRACKS[id].audience}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-sm text-muted">
        Pas d&apos;accord avec le résultat ?{" "}
        <button className="font-semibold text-ink underline" onClick={() => onTest(tested)}>Refaire le test</button>
      </p>
    </div>
  );
}

function Advice({ title, body, track, cta, onCta, other, onOther }: { title: string; body: string; track: TrackId; cta: string; onCta: () => void; other: string; onOther: () => void }) {
  return (
    <section className="tile grid gap-4 p-5 sm:p-6" data-track={track}>
      <div className="flex items-start gap-4">
        <span className="grid size-14 flex-none place-items-center rounded-2xl bg-accent shadow-[0_4px_0_var(--accent-deep)]">
          <Avatar track={track} size={46} mood="wow" decorative />
        </span>
        <div className="grid gap-1">
          <h4 className="display display-s">{title}</h4>
          <p className="text-ink-2">{body}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-accent" onClick={onCta}>{cta}</button>
        <button className="btn btn-ghost" onClick={onOther}>{other}</button>
      </div>
    </section>
  );
}

