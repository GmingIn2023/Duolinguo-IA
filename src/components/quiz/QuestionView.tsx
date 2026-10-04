"use client";

import { ArrowDown, ArrowUp, Bot, Check, UserRound } from "lucide-react";
import type { Answer, Item, Option, Question } from "@/content/types";

export type Draft = Answer | null;
export type Reveal = null | { correct: boolean };

const KEYS = ["1", "2", "3", "4", "5", "6"];

const PROMPT_FOR: Record<Question["type"], string> = {
  mcq: "Choisis la bonne réponse",
  true_false: "Vrai ou faux ?",
  ranking: "Classe",
  ordering: "Remets dans l'ordre",
  fill_choice: "Complète",
  ai_analysis: "Analyse la réponse de l'IA",
};

export function QuestionView({
  question,
  draft,
  setDraft,
  reveal,
  displayOrder,
}: {
  question: Question;
  draft: Draft;
  setDraft: (d: Draft) => void;
  reveal: Reveal;
  /** Option/item ids in display order (shuffled upstream). */
  displayOrder: string[];
}) {
  const locked = reveal !== null;
  const heading = "prompt" in question ? question.prompt : "Cette affirmation est-elle vraie ?";
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-muted">{PROMPT_FOR[question.type]}</p>
        <h2 className={`display ${heading.length > 60 ? "display-s sm:text-[1.875rem]" : "display-m"}`}>{heading}</h2>
      </div>

      {question.type === "true_false" && (
        <>
          <blockquote className="tile p-6 text-xl font-medium leading-snug sm:text-2xl">« {question.statement} »</blockquote>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Vrai ou faux">
            {[true, false].map((v, i) => (
              <ChoiceButton
                key={String(v)}
                k={KEYS[i]}
                selected={draft === v}
                state={stateFor(reveal, draft === v, question.answer === v)}
                disabled={locked}
                onClick={() => setDraft(v)}
                label={v ? "Vrai" : "Faux"}
                radio
              />
            ))}
          </div>
        </>
      )}

      {(question.type === "mcq" || question.type === "fill_choice") && (
        <>
          {question.type === "fill_choice" && <FillSentence sentence={question.sentence} filled={question.options.find((o) => o.id === draft)?.text} />}
          <div className="grid gap-3" role="radiogroup" aria-label="Réponses">
            {order(question.options, displayOrder).map((o, i) => (
              <ChoiceButton
                key={o.id}
                k={KEYS[i]}
                selected={draft === o.id}
                state={stateFor(reveal, draft === o.id, question.answer === o.id)}
                disabled={locked}
                onClick={() => setDraft(o.id)}
                label={o.text}
                radio
              />
            ))}
          </div>
        </>
      )}

      {(question.type === "ordering" || question.type === "ranking") && (
        <Sortable
          items={order(question.items, (draft as string[] | null) ?? displayOrder)}
          onChange={(ids) => setDraft(ids)}
          disabled={locked}
          scale={question.type === "ranking" ? question.scale : undefined}
          reveal={reveal}
          answer={question.answer}
        />
      )}

      {question.type === "ai_analysis" && (
        <>
          <Conversation user={question.userMessage} ai={question.aiResponse} />
          <p className="text-sm font-medium text-ink-2">Plusieurs réponses possibles.</p>
          <div className="grid gap-3" role="group" aria-label="Problèmes repérés">
            {order(question.options, displayOrder).map((o, i) => {
              const selected = Array.isArray(draft) && draft.includes(o.id);
              return (
                <ChoiceButton
                  key={o.id}
                  k={KEYS[i]}
                  selected={selected}
                  state={stateFor(reveal, selected, question.answer.includes(o.id))}
                  disabled={locked}
                  onClick={() => {
                    const cur = Array.isArray(draft) ? draft : [];
                    setDraft(selected ? cur.filter((x) => x !== o.id) : [...cur, o.id]);
                  }}
                  label={o.text}
                  checkbox
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function order<T extends Option | Item>(list: T[], ids: string[]): T[] {
  return ids.map((id) => list.find((x) => x.id === id)).filter(Boolean) as T[];
}

/** After checking: highlight the right answers, and the learner's wrong picks. */
function stateFor(reveal: Reveal, selected: boolean, isAnswer: boolean): "correct" | "wrong" | undefined {
  if (!reveal) return undefined;
  if (isAnswer) return "correct";
  if (selected) return "wrong";
  return undefined;
}

function ChoiceButton({
  k,
  label,
  selected,
  state,
  disabled,
  onClick,
  radio,
  checkbox,
}: {
  k: string;
  label: string;
  selected: boolean;
  state?: "correct" | "wrong";
  disabled: boolean;
  onClick: () => void;
  radio?: boolean;
  checkbox?: boolean;
}) {
  return (
    <button
      type="button"
      role={radio ? "radio" : checkbox ? "checkbox" : undefined}
      aria-checked={selected}
      data-state={state}
      disabled={disabled}
      onClick={onClick}
      data-key={k}
      className="choice"
    >
      <span className="key" aria-hidden>
        {checkbox && selected ? <Check className="size-4" strokeWidth={3} /> : k}
      </span>
      <span className="text-[1.0625rem] font-medium leading-snug">{label}</span>
    </button>
  );
}

function FillSentence({ sentence, filled }: { sentence: string; filled?: string }) {
  const [before, after] = sentence.split("___");
  return (
    <p className="tile p-6 text-xl font-medium leading-relaxed sm:text-2xl">
      {before}
      <span
        className={`mx-1 inline-block min-w-24 rounded-lg px-2 text-center align-baseline transition-colors ${filled ? "bg-accent" : "bg-sunk text-transparent"}`}
        aria-label={filled ? undefined : "case vide"}
      >
        {filled ?? "______"}
      </span>
      {after}
    </p>
  );
}

function Conversation({ user, ai }: { user: string; ai: string }) {
  return (
    <div className="tile grid gap-4 p-4 sm:p-6">
      <div className="flex gap-3">
        <span className="grid size-8 flex-none place-items-center rounded-full bg-sunk" aria-hidden>
          <UserRound className="size-4" />
        </span>
        <div>
          <p className="mb-1 text-sm font-semibold">Utilisateur</p>
          <p className="whitespace-pre-line leading-relaxed text-ink-2">{user}</p>
        </div>
      </div>
      <div className="flex gap-3 rounded-xl bg-paper p-3.5">
        <span className="grid size-8 flex-none place-items-center rounded-full bg-ink text-paper" aria-hidden>
          <Bot className="size-4" />
        </span>
        <div>
          <p className="mb-1 text-sm font-semibold">Réponse de l&apos;IA</p>
          <p className="whitespace-pre-line leading-relaxed">{ai}</p>
        </div>
      </div>
    </div>
  );
}

function Sortable({
  items,
  onChange,
  disabled,
  scale,
  reveal,
  answer,
}: {
  items: Item[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
  scale?: [string, string];
  reveal: Reveal;
  answer: string[];
}) {
  const ids = items.map((i) => i.id);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= ids.length) return;
    const next = [...ids];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  return (
    <div className="grid gap-2">
      {scale && <p className="text-sm font-semibold">↑ {scale[0]}</p>}
      <ol className="grid gap-2.5">
        {items.map((item, i) => {
          const state = reveal ? (answer[i] === item.id ? "correct" : "wrong") : undefined;
          return (
            <li key={item.id} className="choice !cursor-default" data-state={state}>
              <span className="key tabular" aria-hidden>{i + 1}</span>
              <span className="flex-1 text-[1.0625rem] font-medium leading-snug">{item.text}</span>
              {!disabled && (
                <span className="flex flex-none gap-1">
                  <button type="button" className="grid size-10 place-items-center rounded-lg hover:bg-sunk disabled:opacity-25" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Monter « ${item.text} »`}>
                    <ArrowUp className="size-5" />
                  </button>
                  <button type="button" className="grid size-10 place-items-center rounded-lg hover:bg-sunk disabled:opacity-25" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Descendre « ${item.text} »`}>
                    <ArrowDown className="size-5" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {scale && <p className="text-sm font-semibold">↓ {scale[1]}</p>}
    </div>
  );
}

/** Human-readable correct answer, shown in the correction sheet. */
export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
      return q.options.find((o) => o.id === q.answer)!.text;
    case "true_false":
      return q.answer ? "Vrai" : "Faux";
    case "ordering":
    case "ranking":
      return q.answer.map((id, i) => `${i + 1}. ${q.items.find((x) => x.id === id)!.text}`).join("\n");
    case "ai_analysis":
      return q.answer.map((id) => `• ${q.options.find((o) => o.id === id)!.text}`).join("\n");
  }
}

/** Feedback attached to the specific wrong option the learner picked, if any. */
export function optionFeedback(q: Question, answer: Answer): string | undefined {
  if ((q.type === "mcq" || q.type === "fill_choice") && typeof answer === "string") {
    return q.options.find((o) => o.id === answer)?.feedback;
  }
  return undefined;
}

export function isDraftComplete(q: Question, draft: Draft): boolean {
  if (draft === null) return false;
  if (q.type === "ai_analysis") return Array.isArray(draft) && draft.length > 0;
  return true;
}
