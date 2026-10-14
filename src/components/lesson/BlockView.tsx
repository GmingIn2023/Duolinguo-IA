"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Clock, Copy, Lightbulb, Repeat, TriangleAlert, X } from "lucide-react";
import type { Block, TrackId } from "@/content/types";
import { Rich, renderInline } from "@/components/Rich";
import { Illustration } from "@/components/Illustration";
import { ToolCards } from "@/components/ToolCards";
import { QuestionCheck } from "@/components/quiz/QuizRunner";

/** Text colour that stays readable on the theme colour ("projets" is ink-coloured). */
const ON_TH = "text-ink [[data-theme=projets]_&]:text-paper";
const TOUCH = "min-h-11";

function Caption({ children }: { children: string }) {
  return (
    <p className="meta mt-3 max-w-[66ch]">
      <Rich text={children} />
    </p>
  );
}

function Heading({ children }: { children?: string }) {
  if (!children) return null;
  return <h3 className="display display-xs mb-3">{renderInline(children)}</h3>;
}

function Detail({ title, children }: { title?: string; children: string }) {
  return (
    <div className="tile tile-sunk pop-in mt-3 p-4" role="status">
      {title && <p className="display display-xs mb-1">{renderInline(title)}</p>}
      <Rich text={children} as="p" className="text-[0.9375rem] leading-relaxed text-ink-2" />
    </div>
  );
}

export function Blocks({ blocks, track }: { blocks: Block[]; track: TrackId }) {
  return (
    <div className="flex flex-col gap-7">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} track={track} />
      ))}
    </div>
  );
}

export function BlockView({ block, track, onCheckDone }: { block: Block; track: TrackId; onCheckDone?: () => void }) {
  switch (block.type) {
    case "text":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="prose-gg grid gap-3">
            {block.body.split(/\n{2,}/).map((p, i) => (
              <Rich key={i} text={p} as="p" />
            ))}
          </div>
        </section>
      );
    case "definition":
      return (
        <section className="border-l-[6px] border-th py-1 pl-4">
          <p className="display display-s mb-1">{renderInline(block.term)}</p>
          <Rich text={block.body} as="p" className="prose-gg" />
        </section>
      );
    case "example": {
      const tone = block.good === true ? "text-good" : block.good === false ? "text-bad" : "text-muted";
      return (
        <section className="tile p-4 sm:p-5">
          <p className={`meta mb-2 flex items-center gap-1.5 font-semibold ${tone}`}>
            {block.good === true && <Check aria-hidden className="size-4" />}
            {block.good === false && <X aria-hidden className="size-4" />}
            {renderInline(block.label)}
          </p>
          <div className="whitespace-pre-wrap rounded-lg bg-sunk p-3 text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere]">
            {renderInline(block.content)}
          </div>
          {block.note && <Rich text={block.note} as="p" className="meta mt-3" />}
        </section>
      );
    }
    case "dialogue":
      return (
        <section>
          {block.label && <p className="meta mb-3 font-semibold">{renderInline(block.label)}</p>}
          <div className="flex flex-col gap-2.5">
            {block.turns.map((t, i) => (
              <div key={i} className={`flex ${t.who === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere] ${
                    t.who === "user"
                      ? "rounded-br-md bg-ink text-paper [&_code]:text-ink [&_strong]:text-inherit"
                      : "tile rounded-bl-md"
                  }`}
                >
                  <span className="sr-only">{t.who === "user" ? "Toi : " : "Assistant : "}</span>
                  {renderInline(t.text)}
                </div>
              </div>
            ))}
          </div>
          {block.note && <Rich text={block.note} as="p" className="meta mt-3" />}
        </section>
      );
    case "compare":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <div className="hidden grid-cols-2 gap-3 sm:grid">
            {block.columns.map((c, ci) => (
              <p key={ci} className={`display display-xs rounded-lg px-3 py-2 ${ci === 0 ? "bg-sunk" : "bg-th-soft"}`}>
                {renderInline(c)}
              </p>
            ))}
            {block.rows.map((r, i) => (
              <div key={i} className="contents">
                {r.label && <p className="meta col-span-2 -mb-1 mt-2 font-semibold">{renderInline(r.label)}</p>}
                <div className="tile p-3.5 text-[0.9375rem] leading-relaxed">
                  <Rich text={r.a} />
                </div>
                <div className="tile p-3.5 text-[0.9375rem] leading-relaxed">
                  <Rich text={r.b} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:hidden">
            {block.rows.map((r, i) => (
              <div key={i} className="tile p-3.5">
                {r.label && <p className="meta mb-2 font-semibold">{renderInline(r.label)}</p>}
                {([r.a, r.b] as const).map((v, ci) => (
                  <div
                    key={ci}
                    className={`rounded-lg p-3 text-[0.9375rem] leading-relaxed ${ci === 0 ? "bg-sunk" : "mt-2 bg-th-soft"}`}
                  >
                    <p className="meta mb-1 font-semibold">{renderInline(block.columns[ci])}</p>
                    <Rich text={v} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      );
    case "steps":
      return (
        <section>
          <Heading>{block.title}</Heading>
          <ol className="grid gap-4">
            {block.items.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span
                  aria-hidden
                  className={`display flex size-11 flex-none items-center justify-center rounded-full bg-th text-xl ${ON_TH}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 pt-1.5">
                  <p className="display display-xs mb-1">{renderInline(s.title)}</p>
                  <Rich text={s.body} as="p" className="text-[0.9375rem] leading-relaxed text-ink-2" />
                </div>
              </li>
            ))}
          </ol>
        </section>
      );
    case "mistake":
      return (
        <section className="tile border-l-[6px] border-bad p-4 sm:p-5">
          <p className="meta mb-1 flex items-center gap-1.5 font-semibold text-bad">
            <TriangleAlert aria-hidden className="size-4" />
            Erreur fréquente
          </p>
          <p className="display display-s mb-3">{renderInline(block.title)}</p>
          <div className="grid gap-3 text-[0.9375rem] leading-relaxed">
            <div>
              <p className="meta mb-0.5 font-semibold">Pourquoi</p>
              <Rich text={block.why} as="p" />
            </div>
            <div className="rounded-lg bg-good-soft p-3">
              <p className="meta mb-0.5 font-semibold text-good">À la place</p>
              <Rich text={block.fix} as="p" />
            </div>
          </div>
        </section>
      );
    case "keypoint":
      return (
        <section className={`tile tile-th p-4 sm:p-5 ${ON_TH}`}>
          <p className="meta mb-1 flex items-center gap-1.5 font-semibold !text-current opacity-80">
            <Lightbulb aria-hidden className="size-4" />À retenir
          </p>
          <Rich text={block.body} as="p" className="text-lg font-semibold leading-snug [&_code]:text-ink [&_strong]:text-inherit" />
        </section>
      );
    case "table":
      return (
        <section>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[28rem] border-collapse text-left text-[0.9375rem]">
              {block.caption && <caption className="meta px-3 py-2 text-left">{renderInline(block.caption)}</caption>}
              <thead>
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} scope="col" className="bg-th-soft px-3 py-2.5 font-semibold">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((r, ri) => (
                  <tr key={ri} className="border-t border-line align-top">
                    {r.map((c, ci) =>
                      ci === 0 ? (
                        <th key={ci} scope="row" className="px-3 py-2.5 font-semibold">
                          {renderInline(c)}
                        </th>
                      ) : (
                        <td key={ci} className="px-3 py-2.5">
                          {renderInline(c)}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    case "code":
      return <CodeView lang={block.lang} code={block.code} caption={block.caption} />;
    case "illustration":
      return (
        <figure>
          <Illustration id={block.id} caption={block.caption} />
        </figure>
      );
    case "flow":
      return <FlowView {...block} />;
    case "layers":
      return <LayersView {...block} />;
    case "anatomy":
      return <AnatomyView {...block} />;
    case "spectrum":
      return <SpectrumView {...block} />;
    case "check":
      return <QuestionCheck question={block.question} track={track} onDone={() => onCheckDone?.()} />;
    case "exercise":
      return <ExerciseView {...block} />;
    case "tools":
      return <ToolCards toolIds={block.toolIds} />;
  }
}

function CodeView({ lang, code, caption }: { lang: string; code: string; caption?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <figure>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="meta font-mono uppercase tracking-wide">{lang}</span>
        <button type="button" onClick={copy} className={`btn btn-ghost ${TOUCH} gap-1.5`} aria-live="polite">
          {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre className="codeblock font-mono" tabIndex={0}>
        <code>{code}</code>
      </pre>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
}

function FlowView({ title, nodes, loop, caption }: Extract<Block, { type: "flow" }>) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section>
      <Heading>{title}</Heading>
      <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:flex-wrap sm:items-stretch">
        {nodes.map((n, i) => (
          <div key={i} className="flex flex-col items-stretch gap-1 sm:basis-[8rem] sm:flex-1 sm:flex-row sm:items-center">
            <button
              type="button"
              aria-expanded={open === i}
              aria-controls={`flow-detail-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
              className={`tile ${TOUCH} flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[0.9375rem] font-semibold ${
                open === i ? `tile-th ${ON_TH}` : ""
              }`}
            >
              <span aria-hidden className="display text-base opacity-70">
                {i + 1}
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere]">{renderInline(n.label)}</span>
            </button>
            {i < nodes.length - 1 && (
              <>
                <ChevronDown aria-hidden className="mx-auto size-5 flex-none text-muted sm:hidden" />
                <ChevronRight aria-hidden className="hidden size-5 flex-none text-muted sm:block" />
              </>
            )}
          </div>
        ))}
      </div>
      {loop && (
        <p className="meta mt-2 flex items-center gap-1.5">
          <Repeat aria-hidden className="size-4" />
          et on recommence
        </p>
      )}
      {open === null ? (
        <p className="meta mt-3">Touche une étape pour voir le détail.</p>
      ) : (
        <div id={`flow-detail-${open}`}>
          <Detail title={nodes[open].label}>{nodes[open].detail}</Detail>
        </div>
      )}
      {caption && <Caption>{caption}</Caption>}
    </section>
  );
}

function LayersView({ title, layers, caption }: Extract<Block, { type: "layers" }>) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section>
      <Heading>{title}</Heading>
      <div className="grid gap-2">
        {layers.map((l, i) => (
          <div key={i} className="tile overflow-hidden">
            <button
              type="button"
              aria-expanded={open === i}
              aria-controls={`layer-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
              className={`${TOUCH} flex w-full items-center gap-3 border-l-[10px] border-th px-3.5 py-3 text-left font-semibold`}
            >
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{renderInline(l.label)}</span>
              <ChevronDown aria-hidden className={`size-5 flex-none transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div id={`layer-${i}`} className="pop-in bg-sunk px-4 py-3">
                <Rich text={l.detail} as="p" className="text-[0.9375rem] leading-relaxed text-ink-2" />
              </div>
            )}
          </div>
        ))}
      </div>
      {caption && <Caption>{caption}</Caption>}
    </section>
  );
}

function AnatomyView({ title, segments, caption }: Extract<Block, { type: "anatomy" }>) {
  const [sel, setSel] = useState<number | null>(null);
  const labelled = segments.map((s, i) => ({ s, i })).filter((x) => x.s.label);
  const toggle = (i: number) => setSel(sel === i ? null : i);
  const current = sel !== null ? segments[sel] : undefined;
  return (
    <section>
      <Heading>{title}</Heading>
      <div className="tile whitespace-pre-wrap p-4 font-mono text-[0.875rem] leading-[2] [overflow-wrap:anywhere]">
        {segments.map((s, i) =>
          s.label ? (
            <button
              key={i}
              type="button"
              className="seg whitespace-pre-wrap text-left font-[inherit]"
              aria-pressed={sel === i}
              onClick={() => toggle(i)}
            >
              {renderInline(s.text)}
            </button>
          ) : (
            <span key={i}>{renderInline(s.text)}</span>
          ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Légende">
        {labelled.map(({ s, i }) => (
          <button key={i} type="button" className={`chip ${TOUCH}`} aria-pressed={sel === i} onClick={() => toggle(i)}>
            {s.label}
          </button>
        ))}
      </div>
      {current?.label ? (
        <Detail title={current.label}>{current.detail ?? ""}</Detail>
      ) : (
        <p className="meta mt-3">Touche une partie surlignée pour la comprendre.</p>
      )}
      {caption && <Caption>{caption}</Caption>}
    </section>
  );
}

function SpectrumView({ title, poles, items, caption }: Extract<Block, { type: "spectrum" }>) {
  const [sel, setSel] = useState<number | null>(null);
  const pick = (i: number) => setSel(sel === i ? null : i);
  const clamp = (p: number) => Math.min(100, Math.max(0, p));
  const current = sel !== null ? items[sel] : undefined;
  return (
    <section>
      <Heading>{title}</Heading>
      <div className="mb-2 flex justify-between gap-4 text-sm font-semibold">
        <span>{renderInline(poles[0])}</span>
        <span className="text-right">{renderInline(poles[1])}</span>
      </div>
      {/* 640px and up: one bar, labels alternate above and below so they do not collide */}
      <div className="hidden px-10 sm:block">
        <div className="relative h-36">
          <div
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-th-soft shadow-[inset_0_0_0_1.5px_var(--edge)]"
          />
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={sel === i}
              onClick={() => pick(i)}
              className="absolute top-0 flex h-full w-32 -translate-x-1/2 flex-col items-center text-center text-sm font-semibold"
              style={{ left: `${clamp(it.position)}%` }}
            >
              <span className={`flex-1 ${i % 2 === 0 ? "order-1 flex items-end pb-5" : "order-3 flex items-start pt-5"}`}>
                <span className={`rounded-md px-1.5 py-0.5 ${sel === i ? "bg-ink text-paper" : ""}`}>{renderInline(it.label)}</span>
              </span>
              <span
                aria-hidden
                className={`order-2 size-5 flex-none rounded-full border-[3px] border-ink ${sel === i ? "bg-ink" : "bg-th"}`}
              />
            </button>
          ))}
        </div>
      </div>
      {/* under 640px: vertical list, each item with its own mini bar */}
      <ul className="grid gap-2 sm:hidden">
        {items.map((it, i) => (
          <li key={i}>
            <button
              type="button"
              aria-pressed={sel === i}
              onClick={() => pick(i)}
              className={`tile ${TOUCH} w-full px-3.5 py-3 text-left ${sel === i ? "tile-ink" : ""}`}
            >
              <span className="mb-2 block text-[0.9375rem] font-semibold [overflow-wrap:anywhere]">{renderInline(it.label)}</span>
              <span aria-hidden className="relative block h-1.5 rounded-full bg-sunk">
                <span
                  className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-th"
                  style={{ left: `${clamp(it.position)}%` }}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {current?.detail ? (
        <Detail title={current.label}>{current.detail}</Detail>
      ) : (
        items.some((x) => x.detail) && <p className="meta mt-3">Touche un point pour voir le détail.</p>
      )}
      {caption && <Caption>{caption}</Caption>}
    </section>
  );
}

function ExerciseView({ title, prompt, hints = [], solution, minutes }: Extract<Block, { type: "exercise" }>) {
  const [shown, setShown] = useState(0);
  const [reveal, setReveal] = useState(false);
  return (
    <section className="tile border-t-[6px] border-th p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="meta font-semibold uppercase tracking-wide">À toi de jouer</p>
        {minutes != null && (
          <span className="chip chip-th">
            <Clock aria-hidden className="size-4" />
            {minutes} min
          </span>
        )}
      </div>
      <p className="display display-s mb-3">{renderInline(title)}</p>
      <div className="whitespace-pre-wrap rounded-lg bg-sunk p-3 text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere]">
        {renderInline(prompt)}
      </div>
      {hints.slice(0, shown).map((h, i) => (
        <div key={i} className="pop-in mt-3 flex gap-2 text-[0.9375rem] leading-relaxed">
          <Lightbulb aria-hidden className="mt-1 size-4 flex-none text-fox-deep" />
          <Rich text={h} as="p" />
        </div>
      ))}
      <div className="mt-4 flex flex-wrap gap-2">
        {shown < hints.length && (
          <button type="button" className={`btn btn-secondary ${TOUCH}`} onClick={() => setShown(shown + 1)}>
            Un indice
          </button>
        )}
        <button type="button" className={`btn btn-secondary ${TOUCH}`} aria-expanded={reveal} onClick={() => setReveal(!reveal)}>
          {reveal ? "Cacher la solution" : "Voir une solution"}
        </button>
      </div>
      {reveal && (
        <div className="pop-in mt-3 whitespace-pre-wrap rounded-lg bg-good-soft p-3 text-[0.9375rem] leading-relaxed [overflow-wrap:anywhere]">
          <p className="meta mb-1 font-semibold text-good">Une solution possible</p>
          {renderInline(solution)}
        </div>
      )}
    </section>
  );
}
