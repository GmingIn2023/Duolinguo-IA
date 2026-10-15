"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { chooseTrack, savePlacement } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { QuestionView, isDraftComplete, type Draft } from "@/components/quiz/QuestionView";
import { initialDraft, initialOrder } from "@/components/quiz/QuizRunner";
import { LESSONS, TRACKS, TRACK_IDS } from "@/content";
import type { Answer, TrackId } from "@/content/types";
import { coveredByLevel } from "@/lib/board";
import { gradeAnswer } from "@/lib/grading";
import { PLACEMENT_LENGTH, TRACK_FOR_GOAL, levelName, nextPlacementQuestion, placementLevel, type Goal, type PlacementStep } from "@/lib/placement";

const GOALS: { id: Goal; title: string; hint: string }[] = [
  { id: "discover", title: "Comprendre ce qu'est l'IA", hint: "Je débute ou presque : je veux savoir comment ça marche et m'en servir sans risque." },
  { id: "practice", title: "M'en servir pour étudier ou travailler", hint: "J'utilise déjà un assistant, je veux de meilleurs résultats et des méthodes." },
  { id: "build", title: "Construire avec l'IA", hint: "API, agents, RAG, code : je veux concevoir de vrais systèmes." },
];

type Stage = "goal" | "intro" | "test" | "result";
export type PlacementAnswer = { id: string; answer: Answer | null };
export const ONBOARDING_KEY = "gusgus.onboarding";

/**
 * Goal, then an adaptive 10-question test: a right answer raises the next question's level, a miss
 * or "je ne sais pas" lowers it. No correction during the test. The server re-grades everything.
 */
export function Onboarding({ signedIn, currentTrack }: { signedIn: boolean; currentTrack: TrackId | null }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(signedIn ? "intro" : "goal");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [seed] = useState(() => Math.random().toString(36).slice(2));
  const [history, setHistory] = useState<PlacementStep[]>([]);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [chosen, setChosen] = useState<TrackId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const question = useMemo(() => (stage === "test" ? nextPlacementQuestion(history, seed) : null), [stage, history, seed]);
  const [draft, setDraft] = useState<Draft>(null);
  const [draftFor, setDraftFor] = useState<string | null>(null);
  if (question && draftFor !== question.id) {
    setDraftFor(question.id);
    setDraft(initialDraft(question));
  }
  const order = useMemo(() => (question ? initialOrder(question) : []), [question]);

  const level10 = placementLevel(history);
  const suggested: TrackId = goal ? TRACK_FOR_GOAL[goal] : currentTrack ?? (level10 >= 6 ? "fox" : level10 >= 3 ? "gecko" : "bird");
  const track = chosen ?? suggested;

  function answer(value: Answer | null) {
    if (!question) return;
    const correct = value !== null && gradeAnswer(question, value);
    const nextHistory = [...history, { id: question.id, correct }];
    setAnswers((a) => [...a, { id: question.id, answer: value }]);
    setHistory(nextHistory);
    window.scrollTo({ top: 0 });
    if (!nextPlacementQuestion(nextHistory, seed)) setStage("result");
  }

  function skipTest() {
    setHistory([]);
    setAnswers([]);
    setStage("result");
  }

  function finish() {
    setError(null);
    if (!signedIn) {
      try {
        sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify({ placement: answers, goal, track }));
      } catch {}
      router.push(`/signup?track=${track}`);
      return;
    }
    start(async () => {
      try {
        await savePlacement(answers);
        const fd = new FormData();
        fd.set("track", track);
        await chooseTrack(fd); // redirects to the map
      } catch (e) {
        // a redirect is thrown as an error by design: let Next handle it
        if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
        setError("Ton résultat n'a pas été enregistré. Vérifie ta connexion, puis réessaie.");
      }
    });
  }

  const step = stage === "goal" ? 0 : stage === "intro" ? 1 : stage === "test" ? 1 + history.length / PLACEMENT_LENGTH : 2;
  const back = stage === "intro" && !signedIn ? () => setStage("goal") : null;
  const covered = LESSONS.filter((l) => coveredByLevel(l.difficulty, level10));
  const inTrack = new Set(TRACKS[track].nodes.map((n) => n.lessonId).filter(Boolean));
  const coveredHere = covered.filter((l) => inTrack.has(l.id));

  return (
    <div data-track={stage === "result" ? track : undefined} className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
        {back ? (
          <button onClick={back} className="icon-btn" aria-label="Étape précédente"><ArrowLeft className="size-6" aria-hidden /></button>
        ) : (
          <Link href={signedIn ? "/profile" : "/"} className="icon-btn" aria-label="Quitter"><X className="size-6" aria-hidden /></Link>
        )}
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-label="Avancement" aria-valuenow={Math.round((step / 2) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${Math.max(0.04, step / 2) * 100}%` }} />
        </div>
        {stage === "test" && <span className="tabular text-sm font-semibold">{history.length + 1}/{PLACEMENT_LENGTH}</span>}
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:pt-12">
        {stage === "goal" && (
          <div className="fade-in grid gap-8">
            <h1 className="display display-l">Qu&apos;est-ce que tu veux faire avec l&apos;IA ?</h1>
            <div className="grid gap-3" role="radiogroup" aria-label="Ton objectif">
              {GOALS.map((g) => (
                <button key={g.id} role="radio" aria-checked={goal === g.id} className="choice !min-h-16" onClick={() => { setGoal(g.id); window.setTimeout(() => setStage("intro"), 180); }}>
                  <span className="grid gap-0.5">
                    <span className="text-lg font-semibold">{g.title}</span>
                    <span className="text-[0.9375rem] text-muted">{g.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "intro" && (
          <div className="fade-in grid gap-8">
            <div className="grid gap-4">
              <h1 className="display display-l">{signedIn ? "On refait le point." : "Voyons où tu en es."}</h1>
              <p className="lede !max-w-[52ch]">{PLACEMENT_LENGTH} questions, environ 3 minutes. Elles s&apos;adaptent à tes réponses : plus dures quand tu réussis, plus simples sinon. Pas de correction pendant le test, et « Je ne sais pas » est une réponse parfaitement valable.</p>
              <p className="text-ink-2">Ton résultat ouvre directement les cours que tu maîtrises déjà. Tu pourras toujours les faire.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary btn-lg" onClick={() => setStage("test")}>Commencer le test</button>
              <button className="btn btn-ghost btn-lg" onClick={skipTest}>Je débute, passer le test</button>
            </div>
          </div>
        )}

        {stage === "test" && question && (
          <div key={question.id} className="fade-in grid gap-8">
            <QuestionView question={question} draft={draft} setDraft={setDraft} reveal={null} displayOrder={order} />
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary btn-lg" disabled={!isDraftComplete(question, draft)} onClick={() => answer(draft)}>Valider</button>
              <button className="btn btn-ghost btn-lg" onClick={() => answer(null)}>Je ne sais pas</button>
            </div>
          </div>
        )}

        {stage === "result" && (
          <div className="fade-in grid gap-10">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <h1 className="display text-[clamp(4rem,14vw,8rem)] leading-[0.85]">
                  <span className="sr-only">Ton niveau estimé : </span>
                  <span className="reveal-line"><span>{level10}<span className="text-muted">/10</span></span></span>
                </h1>
                <p className="meta" aria-hidden>Ton niveau estimé</p>
              </div>
              <p className="lede !max-w-[54ch]">
                <strong className="text-ink">{levelName(level10)}.</strong>{" "}
                {history.length === 0
                  ? "On part du début, sans jargon."
                  : coveredHere.length
                    ? `${coveredHere.length} cours de base sont validés sur ta carte : tu peux les sauter ou les faire quand même.`
                    : "On part des bases : tout reste ouvert à ton rythme."}
              </p>
            </div>

            <div className="grid gap-3" role="radiogroup" aria-label="Carte de départ">
              <p className="font-semibold">Ta carte de départ</p>
              {[suggested, ...TRACK_IDS.filter((t) => t !== suggested)].map((id) => {
                const t = TRACKS[id];
                const selected = track === id;
                return (
                  <button key={id} role="radio" aria-checked={selected} data-track={id} onClick={() => setChosen(id)} className={`tile tile-press flex items-center gap-5 p-5 text-left ${selected ? "tile-accent" : ""}`}>
                    <span className={`grid size-16 flex-none place-items-center rounded-2xl ${selected ? "bg-surface" : "bg-accent-soft"}`}>
                      <Avatar track={id} size={52} mood={selected ? "cheer" : "happy"} />
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="display display-s">{t.name}</span>
                      <span className="text-[0.9375rem]">{t.pitch}</span>
                      <span className="text-sm font-semibold">{t.animal} · {t.audience}{id === suggested && " · Conseillé pour toi"}</span>
                    </span>
                    {selected && <Check className="size-6 flex-none" strokeWidth={3} aria-hidden />}
                  </button>
                );
              })}
            </div>
            {error && <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 font-medium text-bad">{error}</p>}
            <div>
              <button className="btn btn-primary btn-lg" onClick={finish} disabled={pending}>
                {signedIn ? (pending ? "Enregistrement…" : "Enregistrer et voir ma carte") : "Créer mon compte et commencer"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
