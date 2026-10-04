import type { IllustrationId } from "@/content/types";
import { BookOpen, Check, CircleHelp, Cloud, Database, Eye, Keyboard, PenLine, RotateCcw, Server, Lightbulb } from "lucide-react";

/** Teaching diagrams. Each one encodes the lesson's mechanism, not decoration. */
export function Illustration({ id, caption }: { id: IllustrationId; caption: string }) {
  const Diagram = DIAGRAMS[id];
  return (
    <figure className="tile overflow-hidden">
      <div className="p-5 sm:p-8">
        <Diagram />
      </div>
      <figcaption className="border-t border-line px-5 py-3.5 text-sm text-muted sm:px-8">{caption}</figcaption>
    </figure>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <p className="mb-3 text-sm font-semibold">{children}</p>;
const Box = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl px-3.5 py-2.5 text-sm ${className}`}>{children}</div>
);
const Arrow = () => (
  <svg aria-hidden width="24" height="16" viewBox="0 0 24 16" className="mx-auto my-1.5 rotate-90 text-muted">
    <path d="M2 8h18m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function RulesVsExamples() {
  const mails = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1];
  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
      <div>
        <Label>Programme classique</Label>
        <Box className="bg-sunk">Un humain écrit la règle</Box>
        <Arrow />
        <Box className="bg-sunk font-medium">« Si le mail contient <em>gagnant</em> → spam »</Box>
        <Arrow />
        <Box className="bg-ink text-paper">Résultat</Box>
      </div>
      <div>
        <Label>IA</Label>
        <div className="grid grid-cols-6 gap-1.5" aria-label="12 mails d'exemple, dont 5 marqués spam">
          {mails.map((spam, i) => (
            <div key={i} className={`aspect-[4/3] rounded-md ${spam ? "bg-fox" : "bg-sunk"}`} />
          ))}
        </div>
        <Arrow />
        <Box className="bg-accent-soft font-medium">La machine repère les régularités</Box>
        <Arrow />
        <Box className="bg-ink text-paper">Résultat</Box>
      </div>
    </div>
  );
}

function NextToken() {
  const rows = [
    { w: "canapé", p: 41 },
    { w: "lit", p: 23 },
    { w: "toit", p: 9 },
    { w: "clavier", p: 6 },
  ];
  return (
    <div className="grid gap-5">
      <p className="display text-[clamp(1.5rem,3vw,2.25rem)] leading-tight">
        Le chat dort sur le <span className="rounded-lg bg-accent px-2">canapé</span>
      </p>
      <div className="grid gap-2">
        {rows.map((r, i) => (
          <div key={r.w} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm">
            <span className={i === 0 ? "font-semibold" : "text-ink-2"}>{r.w}</span>
            <span className="h-3 overflow-hidden rounded-full bg-sunk">
              <span className={`block h-full rounded-full ${i === 0 ? "bg-ink" : "bg-ink-2/40"}`} style={{ width: `${r.p * 2}%` }} />
            </span>
            <span className="tabular text-right text-muted">{r.p} %</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">Probabilités inventées pour l&apos;exemple.</p>
    </div>
  );
}

function Hallucination() {
  return (
    <svg viewBox="0 0 520 240" className="h-auto w-full" role="img" aria-label="Deux cercles qui se chevauchent : plausible et vrai. Leur intersection est une réponse fiable ; ce qui est plausible sans être vrai est une hallucination.">
      <circle cx="200" cy="120" r="105" fill="var(--fox-soft)" />
      <circle cx="320" cy="120" r="105" fill="var(--gecko-soft)" />
      <path d="M260 34a105 105 0 0 1 0 172a105 105 0 0 1 0-172z" fill="var(--gecko)" />
      <text x="150" y="112" textAnchor="middle" className="fill-ink text-[15px] font-semibold">Plausible</text>
      <text x="150" y="134" textAnchor="middle" className="fill-[var(--fox-deep)] text-[13px] font-semibold">= hallucination</text>
      <text x="370" y="120" textAnchor="middle" className="fill-ink text-[15px] font-semibold">Vrai</text>
      <text x="260" y="114" textAnchor="middle" className="fill-ink text-[13px] font-semibold">Réponse</text>
      <text x="260" y="132" textAnchor="middle" className="fill-ink text-[13px] font-semibold">fiable</text>
    </svg>
  );
}

function PromptAnatomy() {
  const parts = [
    { k: "Contexte", v: "Je reçois 6 amis samedi, dont 2 végétariens.", c: "bg-bird" },
    { k: "Tâche", v: "Propose un menu de 3 plats.", c: "bg-gecko" },
    { k: "Format", v: "Avec la liste de courses.", c: "bg-fox" },
    { k: "Contraintes", v: "Faciles, prêts en 1 heure.", c: "bg-ink text-paper" },
  ];
  return (
    <div className="grid gap-2.5">
      {parts.map((p) => (
        <div key={p.k} className="grid items-stretch gap-2 sm:grid-cols-[9rem_1fr]">
          <div className={`flex items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold ${p.c}`}>{p.k}</div>
          <div className="flex items-center rounded-xl bg-sunk px-3.5 py-2.5 text-sm">{p.v}</div>
        </div>
      ))}
    </div>
  );
}

function DataFlow() {
  const steps = [
    { icon: Keyboard, t: "Ton message" },
    { icon: Cloud, t: "Internet" },
    { icon: Server, t: "Serveurs de l'éditeur" },
  ];
  const fates = [
    { icon: Database, t: "Conservé" },
    { icon: Eye, t: "Parfois relu" },
    { icon: RotateCcw, t: "Parfois réutilisé pour entraîner" },
  ];
  return (
    <div className="grid gap-5">
      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map(({ icon: I, t }, i) => (
          <li key={t} className="flex items-center gap-3 rounded-xl bg-sunk px-3.5 py-3 text-sm font-medium">
            <I className="size-5 flex-none" aria-hidden strokeWidth={1.8} />
            {t}
            {i < steps.length - 1 && <span aria-hidden className="ml-auto hidden text-muted sm:inline">→</span>}
          </li>
        ))}
      </ol>
      <div className="grid gap-2 sm:grid-cols-3">
        {fates.map(({ icon: I, t }) => (
          <div key={t} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm" style={{ background: "var(--fox-soft)" }}>
            <I className="size-5 flex-none text-[var(--fox-deep)]" aria-hidden strokeWidth={1.8} />
            {t}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">Selon le service et tes réglages.</p>
    </div>
  );
}

function ToolLandscape() {
  const groups = [
    { label: "Converser et créer", tools: ["ChatGPT", "Claude", "DeepSeek"] },
    { label: "Les deux", tools: ["Gemini"] },
    { label: "Chercher et vérifier", tools: ["Perplexity"] },
  ];
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {groups.map((g) => (
          <ul key={g.label} className="grid content-end gap-2 rounded-xl bg-sunk p-2.5 sm:p-4" aria-label={g.label}>
            {g.tools.map((t) => (
              <li key={t} className="truncate rounded-full bg-surface px-3 py-1.5 text-center text-sm font-semibold shadow-[0_3px_0_var(--edge)]" translate="no">{t}</li>
            ))}
          </ul>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium sm:gap-4">
        {groups.map((g) => <span key={g.label}>{g.label}</span>)}
      </div>
    </div>
  );
}

function TutorLoop() {
  const steps = [
    { icon: Lightbulb, t: "Comprendre", d: "Demander une explication" },
    { icon: PenLine, t: "Essayer", d: "Faire l'exercice seul" },
    { icon: Check, t: "Corriger", d: "Faire relire ton essai" },
    { icon: BookOpen, t: "Reformuler", d: "Réexpliquer avec tes mots" },
  ];
  return (
    <ol className="grid gap-2.5 sm:grid-cols-4">
      {steps.map(({ icon: I, t, d }, i) => (
        <li key={t} className={`relative rounded-xl p-4 ${i === 3 ? "bg-accent" : "bg-sunk"}`}>
          <I className="mb-6 size-5" aria-hidden strokeWidth={1.8} />
          <p className="font-semibold">{t}</p>
          <p className="text-sm text-ink-2">{d}</p>
        </li>
      ))}
      <li className="text-sm text-muted sm:col-span-4">Puis on recommence, avec une notion un peu plus difficile.</li>
    </ol>
  );
}

function ReviewChecklist() {
  const rows = ["Qui l'affirme ?", "De quand date l'information ?", "Sur quelles preuves ?", "Une autre source fiable le confirme-t-elle ?"];
  return (
    <ul className="grid gap-2">
      {rows.map((r) => (
        <li key={r} className="flex items-center gap-3 rounded-xl bg-sunk px-4 py-3">
          <CircleHelp className="size-5 flex-none" aria-hidden strokeWidth={1.8} />
          <span className="font-medium">{r}</span>
        </li>
      ))}
    </ul>
  );
}

const DIAGRAMS: Record<IllustrationId, () => React.ReactElement> = {
  "rules-vs-examples": RulesVsExamples,
  "next-token": NextToken,
  hallucination: Hallucination,
  "prompt-anatomy": PromptAnatomy,
  "data-flow": DataFlow,
  "tool-landscape": ToolLandscape,
  "tutor-loop": TutorLoop,
  "review-checklist": ReviewChecklist,
};
