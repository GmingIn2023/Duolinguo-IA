"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { savePreferences } from "@/app/actions";
import { DAILY_GOALS, SESSION_MINUTES, type Preferences } from "@/lib/prefs";

type Option<T> = { v: T; label: string };

const ROWS: { key: keyof Preferences; title: string; hint: string; options: Option<Preferences[keyof Preferences]>[] }[] = [
  { key: "mode", title: "Chemin", hint: "Guidé ouvre un cours à la fois. Libre ouvre tout ton parcours.", options: [{ v: "guided", label: "Guidé" }, { v: "free", label: "Libre" }] },
  { key: "dailyGoal", title: "Objectif du jour", hint: "Les XP à gagner chaque jour.", options: DAILY_GOALS.map((g) => ({ v: g, label: `${g} XP` })) },
  { key: "sessionMinutes", title: "Durée d'une séance", hint: "Pour te proposer des cours à ta mesure.", options: SESSION_MINUTES.map((m) => ({ v: m, label: `${m} min` })) },
  { key: "sounds", title: "Sons", hint: "Un petit son sur les bonnes et mauvaises réponses.", options: [{ v: true, label: "Oui" }, { v: false, label: "Non" }] },
  { key: "motion", title: "Mascotte", hint: "Calme : elle change d'expression sans bouger.", options: [{ v: "full", label: "Animée" }, { v: "calm", label: "Calme" }] },
  { key: "textSize", title: "Texte des cours", hint: "Pour lire plus confortablement.", options: [{ v: "normal", label: "Normal" }, { v: "large", label: "Grand" }] },
];

/** Settings as a list of rows: a name, one line, a small segmented control. Saved on every change. */
export function PreferencesForm({ initial }: { initial: Preferences }) {
  const [prefs, setPrefs] = useState(initial);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();

  const update = (patch: Partial<Preferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setState("idle");
    // the shell reads these attributes: apply them now rather than after the server round trip
    document.querySelector("[data-motion]")?.setAttribute("data-motion", next.motion);
    document.querySelector("[data-text]")?.setAttribute("data-text", next.textSize);
    start(async () => {
      try {
        await savePreferences(next);
        setState("saved");
      } catch {
        setState("error");
      }
    });
  };

  return (
    <div className="grid gap-3">
      <ul className="tile divide-y divide-line">
        {ROWS.map((row) => (
          <li key={row.key} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-5">
            <div className="grid gap-0.5">
              <p className="font-semibold">{row.title}</p>
              <p className="text-sm text-muted">{row.hint}</p>
            </div>
            <div className="flex w-fit flex-wrap gap-1 rounded-full bg-paper p-1 shadow-[inset_0_0_0_1.5px_var(--line)]" role="radiogroup" aria-label={row.title}>
              {row.options.map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  role="radio"
                  aria-checked={prefs[row.key] === o.v}
                  onClick={() => update({ [row.key]: o.v } as Partial<Preferences>)}
                  className="min-h-10 rounded-full px-3.5 text-sm font-semibold text-ink-2 transition-colors aria-checked:bg-ink aria-checked:text-paper"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="meta min-h-6" aria-live="polite">
        {pending ? "Enregistrement…" : state === "saved" ? <span className="inline-flex items-center gap-1.5 text-good"><Check className="size-4" aria-hidden />Enregistré</span> : state === "error" ? <span className="text-bad">Pas enregistré. Vérifie ta connexion.</span> : ""}
      </p>
    </div>
  );
}
