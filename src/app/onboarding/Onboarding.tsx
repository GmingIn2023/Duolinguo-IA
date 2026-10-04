"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { TRACKS, TRACK_IDS } from "@/content";
import type { TrackId } from "@/content/types";
import { estimatePlacement, type Situation, type Usage } from "@/lib/placement";

const LEVEL_TEXT = { 1: "Tout début", 2: "Bases acquises", 3: "Déjà à l'aise" } as const;
const LEVEL_DETAIL = {
  1: "On part de zéro, sans jargon.",
  2: "Les premiers cours sont ouverts si tu veux les sauter.",
  3: "Les cours de base sont ouverts : va directement où tu veux.",
} as const;

type Choice<T> = { value: T; label: string; hint?: string };
type Step<T> = { key: string; title: string; choices: Choice<T>[] };

const SITUATION: Step<Situation> = {
  key: "situation",
  title: "Qu'est-ce qui te décrit le mieux ?",
  choices: [
    { value: "curious", label: "Je découvre l'IA", hint: "Curieux, sans connaissance particulière" },
    { value: "student", label: "Je suis au lycée ou à la fac", hint: "Pour apprendre et réviser" },
    { value: "work", label: "Je veux l'utiliser au travail", hint: "Gagner du temps, travailler mieux" },
  ],
};
const USAGE: Step<Usage> = {
  key: "usage",
  title: "As-tu déjà utilisé un assistant comme ChatGPT ?",
  choices: [
    { value: "never", label: "Jamais" },
    { value: "sometimes", label: "Quelques fois" },
    { value: "often", label: "Régulièrement" },
  ],
};
const KNOW_1: Step<string> = {
  key: "k1",
  title: "D'après toi, un chatbot comme ChatGPT…",
  choices: [
    { value: "search", label: "cherche la réponse dans une base de données" },
    { value: "predict", label: "prédit la suite la plus probable d'un texte" },
    { value: "think", label: "réfléchit comme un humain" },
    { value: "idk", label: "Je ne sais pas" },
  ],
};
const KNOW_2: Step<string> = {
  key: "k2",
  title: "Quand on dit qu'une IA « hallucine », ça veut dire…",
  choices: [
    { value: "invent", label: "qu'elle invente une information fausse avec assurance" },
    { value: "image", label: "qu'elle génère des images bizarres" },
    { value: "bug", label: "qu'elle plante" },
    { value: "idk", label: "Je ne sais pas" },
  ],
};

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [k1, setK1] = useState<string | null>(null);
  const [k2, setK2] = useState<string | null>(null);
  const [chosen, setChosen] = useState<TrackId | null>(null);

  const steps = [SITUATION, USAGE, KNOW_1, KNOW_2] as Step<string>[];
  const values = [situation, usage, k1, k2];
  const setters = [setSituation, setUsage, setK1, setK2] as ((v: string) => void)[];
  const done = step >= steps.length;

  const placement =
    situation && usage
      ? estimatePlacement({ situation, usage, knowledge: Number(k1 === "predict") + Number(k2 === "invent") })
      : null;
  const track = chosen ?? placement?.track ?? "bird";

  function pick(v: string) {
    setters[step](v);
    window.setTimeout(() => setStep((s) => s + 1), 180);
  }

  function finish() {
    if (!placement) return;
    const answers = { situation, usage, k1, k2 };
    try {
      sessionStorage.setItem("gusgus.onboarding", JSON.stringify({ answers, track, level: placement.level }));
    } catch {}
    router.push(`/signup?track=${track}&level=${placement.level}`);
  }

  return (
    <div data-track={done ? track : undefined} className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
        {step > 0 ? (
          <button onClick={() => setStep((s) => s - 1)} className="grid size-10 place-items-center rounded-full hover:bg-sunk" aria-label="Question précédente">
            <ArrowLeft className="size-6" />
          </button>
        ) : (
          <Link href="/" className="grid size-10 place-items-center rounded-full hover:bg-sunk" aria-label="Retour à l'accueil">
            <X className="size-6" />
          </Link>
        )}
        <div className="flex flex-1 gap-1.5" aria-label={`Étape ${Math.min(step + 1, 5)} sur 5`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-ink" : "bg-sunk"}`} />
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:pt-14">
        {!done ? (
          <div key={step} className="fade-in grid gap-8">
            <h1 className="display display-l">{steps[step].title}</h1>
            <div className="grid gap-3" role="radiogroup" aria-label={steps[step].title}>
              {steps[step].choices.map((c) => (
                <button key={c.value} role="radio" aria-checked={values[step] === c.value} className="choice !min-h-16" onClick={() => pick(c.value)}>
                  <span className="grid">
                    <span className="text-lg font-semibold">{c.label}</span>
                    {c.hint && <span className="text-[0.9375rem] text-muted">{c.hint}</span>}
                  </span>
                </button>
              ))}
            </div>
            {step >= 2 && <p className="text-sm text-muted">Pas de piège : « Je ne sais pas » est une réponse parfaitement valable.</p>}
          </div>
        ) : (
          placement && (
            <div className="fade-in grid gap-10">
              <div className="grid gap-4">
                <h1 className="display display-l">On te propose ce parcours.</h1>
                <p className="lede">Ton niveau estimé&nbsp;: <strong className="text-ink">{LEVEL_TEXT[placement.level]}</strong>. {LEVEL_DETAIL[placement.level]} Tu peux choisir un autre parcours maintenant, ou en changer plus tard.</p>
              </div>
              <div className="grid gap-3" role="radiogroup" aria-label="Parcours">
                {[placement.track, ...TRACK_IDS.filter((t) => t !== placement.track)].map((id) => {
                  const t = TRACKS[id];
                  const selected = track === id;
                  return (
                    <button
                      key={id}
                      role="radio"
                      aria-checked={selected}
                      data-track={id}
                      onClick={() => setChosen(id)}
                      className={`tile tile-press flex items-center gap-5 p-5 text-left ${selected ? "tile-accent" : ""}`}
                    >
                      <span className={`grid size-16 flex-none place-items-center rounded-2xl ${selected ? "bg-surface" : "bg-accent-soft"}`}>
                        <Avatar track={id} size={52} />
                      </span>
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="display display-s">{t.name}</span>
                        <span className="text-[0.9375rem]">{t.pitch}</span>
                        <span className="text-sm font-semibold">
                          {t.animal} · {t.audience}
                          {id === placement.track && " · Recommandé pour toi"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div>
                <button className="btn btn-primary btn-lg" onClick={finish}>Créer mon compte et commencer</button>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
