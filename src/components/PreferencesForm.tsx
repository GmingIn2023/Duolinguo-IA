"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { savePreferences } from "@/app/actions";
import { THEMES, THEME_IDS } from "@/content/curriculum";
import type { ThemeId } from "@/content/types";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { SESSION_MINUTES, type Preferences } from "@/lib/prefs";

const MODES = [
  { v: "guided", label: "Guidé", hint: "Une étape conseillée à la fois, la plus utile maintenant." },
  { v: "free", label: "Libre", hint: "Toutes les branches ouvertes se valent : tu choisis." },
] as const;

const PACE: { v: Preferences["pace"]; label: string; hint: string }[] = [
  { v: -1, label: "Tout revoir", hint: "Le test de niveau valide moins de cours." },
  { v: 0, label: "Équilibré", hint: "Ton niveau décide de ce que tu peux sauter." },
  { v: 1, label: "Aller vite", hint: "Le test valide davantage de cours de base." },
];

export function PreferencesForm({ initial }: { initial: Preferences }) {
  const [prefs, setPrefs] = useState(initial);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();

  const update = (patch: Partial<Preferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setState("idle");
    start(async () => {
      try {
        await savePreferences(next);
        setState("saved");
      } catch {
        setState("error");
      }
    });
  };
  const toggleTheme = (t: ThemeId) => update({ themes: prefs.themes.includes(t) ? prefs.themes.filter((x) => x !== t) : [...prefs.themes, t] });

  return (
    <div className="grid gap-8">
      <fieldset className="grid gap-3">
        <legend className="mb-3 font-semibold">Comment avancer</legend>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Mode">
          {MODES.map((o) => (
            <button key={o.v} type="button" role="radio" aria-checked={prefs.mode === o.v} className="choice !items-start" onClick={() => update({ mode: o.v })}>
              <span className="grid gap-0.5"><span className="font-semibold">{o.label}</span><span className="text-[0.9375rem] text-ink-2">{o.hint}</span></span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-semibold">Thèmes à mettre en avant</legend>
        <p className="text-[0.9375rem] text-ink-2">Dans l&apos;ordre où tu les touches. Les prérequis restent respectés.</p>
        <div className="flex flex-wrap gap-2">
          {THEME_IDS.map((t) => {
            const rank = prefs.themes.indexOf(t);
            return (
              <button key={t} type="button" data-theme={t} className="chip" aria-pressed={rank !== -1} onClick={() => toggleTheme(t)}>
                {rank !== -1 ? <span className="tabular grid size-5 place-items-center rounded-full bg-paper text-[0.75rem] text-ink">{rank + 1}</span> : <ThemeGlyph theme={t} size={16} />}
                {THEMES[t].short}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-3 font-semibold">Durée d&apos;une séance</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Durée d'une séance">
          {SESSION_MINUTES.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={prefs.sessionMinutes === m} className="chip !min-h-11 !px-5" onClick={() => update({ sessionMinutes: m })}>{m} min</button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-3 font-semibold">Rythme</legend>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Rythme">
          {PACE.map((o) => (
            <button key={o.v} type="button" role="radio" aria-checked={prefs.pace === o.v} className="choice !items-start" onClick={() => update({ pace: o.v })}>
              <span className="grid gap-0.5"><span className="font-semibold">{o.label}</span><span className="text-[0.9375rem] text-ink-2">{o.hint}</span></span>
            </button>
          ))}
        </div>
      </fieldset>

      <p className="meta min-h-6" aria-live="polite">
        {pending ? "Enregistrement…" : state === "saved" ? <span className="inline-flex items-center gap-1.5 text-good"><Check className="size-4" aria-hidden />Enregistré</span> : state === "error" ? <span className="text-bad">Pas enregistré. Vérifie ta connexion.</span> : ""}
      </p>
    </div>
  );
}
