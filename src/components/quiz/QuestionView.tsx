"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Bot, Check, CircleCheck, CircleDashed, UserRound } from "lucide-react";
import type { Answer, Item, Option, Question, QuestionVisual } from "@/content/types";
import { WRITTEN_MAX, metCriteria } from "@/lib/grading";
import { Rich, renderInline } from "@/components/Rich";

export type Draft = Answer | null;
export type Reveal = null | { correct: boolean; skipped?: boolean };

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const WRITTEN_MIN = 3;

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
  /** Option/item ids in display order (shuffled upstream). For `match`, the right-hand ids. */
  displayOrder: string[];
}) {
  const locked = reveal !== null;
  const heading = "prompt" in question ? question.prompt : `« ${question.statement} »`;
  const long = heading.length > 60 && question.type !== "true_false";
  return (
    <div className="grid gap-6">
      {question.visual && <Visual visual={question.visual} />}
      <div className="grid gap-2">
        <h2 className={`display ${long ? "display-s sm:text-[1.875rem]" : "display-m"}`}>{renderInline(heading)}</h2>
        {question.type === "true_false" && <p className="text-[1.0625rem] text-ink-2">Cette affirmation est-elle vraie ?</p>}
      </div>

      {question.type === "true_false" && (
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
      )}

      {(question.type === "mcq" || question.type === "fill_choice") && (
        <>
          {question.type === "fill_choice" && <FillSentence
              sentence={question.sentence}
              filled={question.options.find((o) => o.id === draft)?.text}
              state={reveal ? (draft === question.answer ? "correct" : "wrong") : undefined}
            />}
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
          items={order(question.items, Array.isArray(draft) ? draft : displayOrder)}
          onChange={(ids) => setDraft(ids)}
          disabled={locked}
          scale={question.type === "ranking" ? question.scale : undefined}
          reveal={reveal}
          answer={question.answer}
        />
      )}

      {(question.type === "ai_analysis" || question.type === "multi") && (
        <>
          {question.type === "ai_analysis" && <Conversation user={question.userMessage} ai={question.aiResponse} />}
          <p className="text-sm font-medium text-ink-2">Plusieurs réponses possibles.</p>
          <div className="grid gap-3" role="group" aria-label="Réponses possibles">
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
                  note={reveal && !selected && question.answer.includes(o.id) ? "Il fallait aussi cocher celle-ci." : undefined}
                />
              );
            })}
          </div>
        </>
      )}

      {question.type === "match" && (
        <MatchBoard
          left={question.left}
          right={order(question.right, displayOrder)}
          allRight={question.right}
          answer={question.answer}
          draft={Array.isArray(draft) && draft.length === question.left.length ? draft : question.left.map(() => "")}
          setDraft={setDraft}
          reveal={reveal}
        />
      )}

      {question.type === "sort" && (
        <SortBins
          items={order(question.items, displayOrder)}
          allItems={question.items}
          bins={question.bins}
          answer={question.answer}
          draft={Array.isArray(draft) && draft.length === question.items.length ? draft : question.items.map(() => "")}
          setDraft={setDraft}
          reveal={reveal}
        />
      )}

      {question.type === "written" && <WrittenField question={question} value={typeof draft === "string" ? draft : ""} setDraft={setDraft} reveal={reveal} />}
    </div>
  );
}

/** "Same question, two answers": a tiny chat and the odds of the next word, drawn as bars. */
function Visual({ visual }: { visual: QuestionVisual }) {
  const max = Math.max(...visual.bars.map((b) => b.p));
  return (
    <figure className="tile grid gap-4 p-4 sm:grid-cols-[1.15fr_1fr] sm:gap-6 sm:p-5">
      <div className="grid content-start gap-2.5">
        <p className="w-fit max-w-full rounded-2xl rounded-bl-md bg-sunk px-3.5 py-2 text-[0.9375rem] font-medium">{visual.ask}</p>
        {visual.answers.map((a, i) => (
          <p key={a} className="ml-auto flex w-fit max-w-full items-center gap-2 rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-[0.9375rem] text-paper">
            <span className="rounded-md bg-paper/15 px-1.5 text-xs font-semibold">{i === 0 ? "1er essai" : "2e essai"}</span>
            {a}
          </p>
        ))}
      </div>
      <div className="grid content-start gap-2">
        <figcaption className="text-sm font-semibold text-ink-2">Mots possibles juste après</figcaption>
        <ul className="grid gap-1.5" aria-label="Probabilité de chaque mot">
          {visual.bars.map((b) => (
            <li key={b.label} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-2 text-sm">
              <span className="font-medium">{b.label}</span>
              <span className="h-3 overflow-hidden rounded-full bg-sunk" aria-hidden>
                <span className="block h-full rounded-full bg-accent" style={{ width: `${(b.p / max) * 100}%` }} />
              </span>
              <span className="tabular text-right text-muted">{b.p} %</span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

/** Each card goes in one of two bins. `draft[i]` is "0", "1" or "" for `allItems[i]`. */
function SortBins({
  items,
  allItems,
  bins,
  answer,
  draft,
  setDraft,
  reveal,
}: {
  items: Item[];
  allItems: Item[];
  bins: [string, string];
  answer: (0 | 1)[];
  draft: string[];
  setDraft: (d: Draft) => void;
  reveal: Reveal;
}) {
  const locked = reveal !== null;
  return (
    <ul className="grid gap-3" aria-label="Cartes à ranger">
      {items.map((item) => {
        const i = allItems.findIndex((x) => x.id === item.id);
        const value = draft[i];
        const state = reveal ? (value === String(answer[i]) ? "correct" : "wrong") : undefined;
        return (
          <li key={item.id} className="choice !grid !cursor-default gap-3 sm:!grid-cols-[1fr_auto] sm:items-center" data-state={state}>
            <span className="text-[1.0625rem] font-medium leading-snug">{renderInline(item.text)}</span>
            <span className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={`Ranger « ${item.text} »`}>
              {bins.map((bin, b) => (
                <button
                  key={bin}
                  type="button"
                  role="radio"
                  aria-checked={value === String(b)}
                  disabled={locked}
                  onClick={() => setDraft(draft.map((v, j) => (j === i ? String(b) : v)))}
                  className="chip !min-h-11 justify-center !whitespace-normal !px-3 text-center leading-tight"
                >
                  {bin}
                </button>
              ))}
            </span>
            {reveal && state === "wrong" && <span className="text-sm font-semibold text-bad sm:col-span-2">Ici : {bins[answer[i]]}</span>}
          </li>
        );
      })}
    </ul>
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
  note,
}: {
  k: string;
  note?: string;
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
      <span className="grid gap-0.5">
        <span className="text-[1.0625rem] font-medium leading-snug">{renderInline(label)}</span>
        {note && <span className="text-sm font-semibold text-good">{note}</span>}
      </span>
    </button>
  );
}

function FillSentence({ sentence, filled, state }: { sentence: string; filled?: string; state?: "correct" | "wrong" }) {
  const [before, after] = sentence.split("___");
  const tone = !filled
    ? "bg-sunk text-transparent"
    : state === "correct"
      ? "bg-good-soft shadow-[inset_0_0_0_2px_var(--good)]"
      : state === "wrong"
        ? "bg-bad-soft text-bad line-through decoration-2 shadow-[inset_0_0_0_2px_var(--bad)]"
        : "bg-accent";
  return (
    <p className="tile p-6 text-xl font-medium leading-relaxed sm:text-2xl">
      {renderInline(before)}
      <span
        className={`mx-1 inline-block min-w-24 rounded-lg px-2 text-center align-baseline transition-colors ${tone}`}
        aria-label={filled ? undefined : "case vide"}
      >
        {filled ? renderInline(filled) : "______"}
      </span>
      {renderInline(after ?? "")}
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
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold">Utilisateur</p>
          <Rich as="p" text={user} className="block leading-relaxed text-ink-2" />
        </div>
      </div>
      <div className="flex gap-3 rounded-xl bg-paper p-3.5">
        <span className="grid size-8 flex-none place-items-center rounded-full bg-ink text-paper" aria-hidden>
          <Bot className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold">Réponse de l&apos;IA</p>
          <Rich as="p" text={ai} className="block leading-relaxed" />
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
  const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, i: number) => {
    if (disabled || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const to = e.key === "ArrowUp" ? i - 1 : i + 1;
    if (to < 0 || to >= ids.length) return;
    const list = e.currentTarget.parentElement;
    move(i, to);
    requestAnimationFrame(() => (list?.children[to] as HTMLElement | undefined)?.focus());
  };
  return (
    <div className="grid gap-2">
      {scale && <p className="text-sm font-semibold">↑ {scale[0]}</p>}
      <ol className="grid gap-2.5">
        {items.map((item, i) => {
          const state = reveal ? (answer[i] === item.id ? "correct" : "wrong") : undefined;
          return (
            <li
              key={item.id}
              className="choice !cursor-default"
              data-state={state}
              tabIndex={disabled ? undefined : 0}
              onKeyDown={(e) => e.target === e.currentTarget && onKeyDown(e, i)}
            >
              <span className="key tabular" aria-hidden>{i + 1}</span>
              <span className="flex-1 text-[1.0625rem] font-medium leading-snug">{renderInline(item.text)}</span>
              {!disabled && (
                <span className="flex flex-none gap-1">
                  <button type="button" className="grid size-11 place-items-center rounded-lg hover:bg-sunk disabled:opacity-25" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Monter « ${item.text} »`}>
                    <ArrowUp className="size-5" />
                  </button>
                  <button type="button" className="grid size-11 place-items-center rounded-lg hover:bg-sunk disabled:opacity-25" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Descendre « ${item.text} »`}>
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

/** Tap an item on the left, then its partner on the right. `draft[i]` is the right id paired with `left[i]` ("" if none). */
function MatchBoard({
  left,
  right,
  allRight,
  answer,
  draft,
  setDraft,
  reveal,
}: {
  left: Item[];
  right: Item[];
  allRight: Item[];
  answer: string[];
  draft: string[];
  setDraft: (d: Draft) => void;
  reveal: Reveal;
}) {
  const [sel, setSel] = useState<number | null>(0);
  const locked = reveal !== null;
  const textOf = (id: string) => allRight.find((r) => r.id === id)?.text ?? "";

  const pick = (rid: string) => {
    const target = sel ?? draft.findIndex((v) => !v);
    if (target < 0) return;
    const next = draft.map((v, j) => (j === target ? rid : v === rid ? "" : v));
    setDraft(next);
    const following = next.findIndex((v, j) => !v && j !== target);
    setSel(following >= 0 ? following : null);
  };

  return (
    <div className="grid gap-5">
      {!locked && <p className="text-sm font-medium text-ink-2">Touche un élément, puis son partenaire.</p>}
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <ul className="grid content-start gap-2.5" aria-label="Éléments à associer">
          {left.map((l, i) => {
            const paired = draft[i];
            const state = reveal ? (paired === answer[i] ? "correct" : "wrong") : undefined;
            return (
              <li key={l.id} className="grid gap-1.5">
                <button type="button" className="choice" aria-pressed={sel === i} data-state={state} disabled={locked} onClick={() => setSel(sel === i ? null : i)}>
                  <span className="key tabular" aria-hidden>{i + 1}</span>
                  <span className="grid gap-0.5 text-left">
                    <span className="text-[1.0625rem] font-medium leading-snug">{renderInline(l.text)}</span>
                    <span className={`text-sm leading-snug ${paired ? "text-ink-2" : "text-muted"}`}>
                      {paired ? <>→ {renderInline(textOf(paired))}</> : "Pas encore associé"}
                    </span>
                  </span>
                </button>
                {reveal && state === "wrong" && <p className="px-2 text-sm font-medium text-bad">Attendu : {renderInline(textOf(answer[i]))}</p>}
              </li>
            );
          })}
        </ul>
        {!locked && (
          <ul className="grid content-start gap-2.5" aria-label="Partenaires possibles">
            {right.map((r) => {
              const owner = draft.indexOf(r.id);
              return (
                <li key={r.id}>
                  <button type="button" className="choice" aria-pressed={sel !== null && owner === sel} onClick={() => pick(r.id)}>
                    <span className="flex-1 text-left text-[1.0625rem] font-medium leading-snug">{renderInline(r.text)}</span>
                    {owner >= 0 && (
                      <span className="tabular grid size-6 flex-none place-items-center rounded-md bg-sunk text-xs font-bold" aria-label={`Associé à ${owner + 1}`}>
                        {owner + 1}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function WrittenField({
  question,
  value,
  setDraft,
  reveal,
}: {
  question: Extract<Question, { type: "written" }>;
  value: string;
  setDraft: (d: Draft) => void;
  reveal: Reveal;
}) {
  const met = reveal ? metCriteria(question, value) : [];
  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <textarea
          className="field-area"
          value={value}
          maxLength={WRITTEN_MAX}
          readOnly={reveal !== null}
          placeholder={question.placeholder ?? "Écris ta réponse avec tes mots."}
          aria-label="Ta réponse"
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
        />
        {!reveal && (
          <p className="flex justify-between gap-3 text-sm text-muted">
            <span>On vérifie tes idées, pas l&apos;orthographe.</span>
            <span className="tabular flex-none">
              {value.length} / {WRITTEN_MAX}
            </span>
          </p>
        )}
      </div>
      {reveal && (
        <>
          <div className="tile grid gap-3 p-4 sm:p-5">
            <p className="text-sm font-semibold">Idées attendues</p>
            <ul className="grid gap-2.5">
              {question.criteria.map((c) => {
                const ok = met.includes(c.id);
                return (
                  <li key={c.id} className="flex items-start gap-2.5">
                    {ok ? <CircleCheck className="mt-0.5 size-5 flex-none text-good" aria-hidden /> : <CircleDashed className="mt-0.5 size-5 flex-none text-muted" aria-hidden />}
                    <span className={`leading-snug ${ok ? "font-medium" : "text-ink-2"}`}>
                      {renderInline(c.label)}
                      <span className="sr-only">{ok ? " : présent" : " : absent"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-xl bg-accent-soft p-4 sm:p-5">
            <p className="mb-1.5 text-sm font-semibold">Une réponse possible</p>
            <Rich as="p" text={question.modelAnswer} className="block leading-relaxed" />
          </div>
        </>
      )}
    </div>
  );
}

/** Human-readable correct answer, shown in the correction sheet. */
export function correctAnswerText(q: Question): string {
  const text = (list: { id: string; text: string }[], id: string) => list.find((x) => x.id === id)?.text ?? "";
  switch (q.type) {
    case "mcq":
    case "fill_choice":
      return text(q.options, q.answer);
    case "true_false":
      return q.answer ? "Vrai" : "Faux";
    case "ordering":
    case "ranking":
      return q.answer.map((id, i) => `${i + 1}. ${text(q.items, id)}`).join("\n");
    case "ai_analysis":
    case "multi":
      return q.answer.map((id) => `• ${text(q.options, id)}`).join("\n");
    case "match":
      return q.left.map((l, i) => `${l.text} → ${text(q.right, q.answer[i])}`).join("\n");
    case "sort":
      return q.bins.map((bin, b) => `${bin} : ${q.items.filter((_, i) => q.answer[i] === b).map((x) => x.text).join(", ")}`).join("\n");
    case "written":
      return q.modelAnswer;
  }
}

/** Feedback attached to the specific wrong option(s) the learner picked, if any. */
export function optionFeedback(q: Question, answer: Answer): string | undefined {
  if ((q.type === "mcq" || q.type === "fill_choice") && typeof answer === "string") {
    return q.options.find((o) => o.id === answer)?.feedback;
  }
  if ((q.type === "multi" || q.type === "ai_analysis") && Array.isArray(answer)) {
    const lines = answer
      .filter((id) => !q.answer.includes(id))
      .map((id) => q.options.find((o) => o.id === id)?.feedback)
      .filter(Boolean);
    return lines.length ? lines.join(" ") : undefined;
  }
  return undefined;
}

export function isDraftComplete(q: Question, draft: Draft): boolean {
  if (draft === null) return false;
  switch (q.type) {
    case "ai_analysis":
    case "multi":
      return Array.isArray(draft) && draft.length > 0;
    case "match":
      return Array.isArray(draft) && draft.length === q.left.length && draft.every(Boolean);
    case "sort":
      return Array.isArray(draft) && draft.length === q.items.length && draft.every(Boolean);
    case "written":
      return typeof draft === "string" && draft.trim().length >= WRITTEN_MIN;
    default:
      return true;
  }
}
