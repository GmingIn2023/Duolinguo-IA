"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Flag } from "lucide-react";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import type { ThemeId, TrackId } from "@/content/types";
import type { LandingBoard, LandingNode, LandingPlan } from "@/lib/landingBoard";

const TRACKS: TrackId[] = ["bird", "gecko", "fox"];
const X = 64;
const Y = 46;
const PAD_X = 40;
const HEADER = 54;

/**
 * Ten theme tiles and the plan of the three tracks. A tile filters the plan: the lessons of that theme stay lit.
 * Both are drawn from the real curriculum (see buildLandingPlan).
 */
export function ThemePlan({ plan }: { plan: LandingPlan }) {
  const [track, setTrack] = useState<TrackId>("bird");
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const planRef = useRef<HTMLElement>(null);

  function pickTheme(id: ThemeId) {
    const next = theme === id ? null : id;
    setTheme(next);
    if (!next) return;
    const has = (t: TrackId) => plan.boards[t].nodes.some((n) => n.theme === next);
    if (!has(track)) setTrack(TRACKS.find(has) ?? track);
    planRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <section id="themes" className="mx-auto max-w-[90rem] scroll-mt-6 px-4 py-20 sm:px-8 lg:py-28">
        <div className="mb-10 grid max-w-[40rem] gap-3">
          <p className="eyebrow">Dix thèmes</p>
          <h2 className="display display-l">De la première question au projet complet.</h2>
          <p className="lede">Touche un thème pour voir où il se trouve dans les parcours.</p>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Les dix thèmes">
          {plan.themes.map((t) => (
            <li key={t.id} className="contents">
              <button type="button" data-theme={t.id} aria-pressed={theme === t.id} onClick={() => pickTheme(t.id)} className="tile-th tile tile-press grid min-h-44 content-center justify-items-center gap-2 p-4 text-center aria-pressed:outline aria-pressed:outline-[3px] aria-pressed:outline-offset-[3px] aria-pressed:outline-ink">
                <span className="grid size-11 place-items-center rounded-full bg-surface text-ink">
                  <ThemeGlyph theme={t.id} size={22} />
                </span>
                <span className="display display-xs">{t.name}</span>
                <span className="text-[0.8125rem] leading-snug">{t.pitch}</span>
                <span className="text-xs font-bold">{t.lessons} cours</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="plan" ref={planRef} className="scroll-mt-0 bg-sky-soft">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-28">
          <div className="mb-8 grid max-w-[42rem] gap-3">
            <p className="eyebrow">Le plan</p>
            <h2 className="display display-l">Le chemin de chaque parcours.</h2>
            <p className="lede">{plan.uniqueLessons} cours au total. Un cours commun à plusieurs parcours ne se fait qu&apos;une fois.</p>
          </div>
          <div className="mb-5 inline-flex flex-wrap gap-1 rounded-full bg-surface p-1.5 shadow-[inset_0_0_0_1.5px_var(--line)]" role="tablist" aria-label="Parcours">
            {TRACKS.map((t) => (
              <button key={t} role="tab" type="button" aria-selected={track === t} id={`tab-${t}`} aria-controls="plan-panel" onClick={() => setTrack(t)} className="min-h-11 rounded-full px-5 text-[0.95rem] font-bold aria-selected:bg-ink aria-selected:text-paper">
                {plan.boards[t].name}
              </button>
            ))}
          </div>
          <PathBoard board={plan.boards[track]} theme={theme} themeName={theme ? plan.themes.find((t) => t.id === theme)?.name ?? "" : ""} onClear={() => setTheme(null)} />
        </div>
      </section>
    </>
  );
}

const SOFT: Record<TrackId, string> = { bird: "var(--bird-soft)", gecko: "var(--gecko-soft)", fox: "var(--fox-soft)" };
const DEEP: Record<TrackId, string> = { bird: "var(--bird-deep)", gecko: "var(--gecko-deep)", fox: "var(--fox-deep)" };
const BASE: Record<TrackId, string> = { bird: "var(--bird)", gecko: "var(--gecko)", fox: "var(--fox)" };

/** One stop: a shape with its symbol drawn inside it, never beside it. */
function Stop({ kind, theme, track, shared, x, y }: { kind: LandingNode["kind"]; theme: ThemeId | null; track: TrackId; shared: boolean; x: number; y: number }) {
  return (
    <g className="stop-body">
      {kind === "checkpoint" ? (
        <>
          <circle cx={x} cy={y} r={15} style={{ fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 1.8 }} />
          <Check x={x - 8} y={y - 8} width={16} height={16} strokeWidth={2.4} style={{ color: "var(--ink)" }} aria-hidden />
        </>
      ) : kind === "finale" ? (
        <>
          <circle cx={x} cy={y} r={17} style={{ fill: "var(--ink)" }} />
          <Flag x={x - 8} y={y - 8} width={16} height={16} strokeWidth={2.2} style={{ color: BASE[track] }} aria-hidden />
        </>
      ) : (
        <>
          <circle cx={x} cy={y} r={15} style={{ fill: SOFT[track], stroke: DEEP[track], strokeWidth: 1.6 }} />
          <g transform={`translate(${x - 9} ${y - 9})`} style={{ color: "var(--ink)" }}>
            {theme && <ThemeGlyph theme={theme} size={18} />}
          </g>
        </>
      )}
      {shared && <circle cx={x + 12} cy={y - 12} r={4.6} style={{ fill: "var(--ink)", stroke: "var(--surface)", strokeWidth: 1.6 }} />}
    </g>
  );
}

function PathBoard({ board, theme, themeName, onClear }: { board: LandingBoard; theme: ThemeId | null; themeName: string; onClear: () => void }) {
  const [shown, setShown] = useState<LandingNode | null>(null);
  const [active, setActive] = useState<string>(board.nodes[0].id);
  const refs = useRef(new Map<string, SVGGElement>());
  const ordered = useMemo(() => [...board.nodes].sort((a, b) => a.col - b.col || a.lane - b.lane), [board]);
  const point = (n: Pick<LandingNode, "col" | "lane">) => ({ x: PAD_X + n.col * X, y: HEADER + 30 + (n.lane - board.minLane) * Y });
  const byId = new Map(board.nodes.map((n) => [n.id, n]));
  const width = PAD_X * 2 + board.maxCol * X;
  const height = HEADER + 60 + (board.maxLane - board.minLane) * Y;
  // a link that jumps over a column is only a hint; the links of the stop being read come forward
  const links = board.nodes.flatMap((n) => n.from.map((f) => ({ from: f, to: n.id, long: n.col - (byId.get(f)?.col ?? n.col) > 1 })));
  const unitName = (id: string) => board.units.find((u) => u.id === id)?.name ?? "";
  const themeOfLabel = (n: LandingNode) => (n.kind === "checkpoint" ? "Bilan" : n.kind === "finale" ? "Projet final" : "Cours");
  const count = theme ? board.nodes.filter((n) => n.theme === theme).length : 0;

  function onKey(e: React.KeyboardEvent, id: string) {
    const i = ordered.findIndex((n) => n.id === id);
    const j = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? ordered.length - 1 : -1;
    if (j < 0 || j >= ordered.length) return;
    e.preventDefault();
    const next = ordered[j].id;
    setActive(next);
    setShown(ordered[j]);
    refs.current.get(next)?.focus();
  }

  return (
    <div className="rounded-[22px] border-[1.5px] border-[#bcd7ee] bg-surface p-4 sm:p-5" id="plan-panel" role="tabpanel" aria-labelledby={`tab-${board.track}`}>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[46rem]">
          <strong>
            {board.name} · {board.lessons} cours
          </strong>{" "}
          · {board.pitch}
        </p>
        {theme && (
          <button type="button" onClick={onClear} className="min-h-9 rounded-full bg-ink px-4 text-sm font-semibold text-paper">
            {themeName} : {count} cours ici ✕
          </button>
        )}
      </div>
      <p className="mb-1 hidden text-sm text-muted max-md:block">Fais glisser pour voir la suite.</p>
      <div className="overflow-x-auto pb-1">
        <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`Plan du parcours ${board.name}, de gauche à droite`} className="block h-auto w-full min-w-[46rem]" key={board.track}>
          {board.units.map((u, i) => {
            const next = board.units[i + 1];
            const last = !next;
            // a label may run past its own line while the next unit has not started; the last one is right-aligned
            const room = (next ? (next.fromCol - u.fromCol) * X - 10 : 200);
            const fits = Math.floor(room / 6.4);
            const text = u.name.length > fits ? `${u.name.slice(0, Math.max(3, fits - 1))}…` : u.name;
            const x1 = PAD_X + u.fromCol * X - 14;
            const x2 = PAD_X + u.toCol * X + 14;
            return (
              <g key={u.id}>
                <line x1={x1} x2={x2} y1={26} y2={26} stroke="#cfc4a8" strokeWidth={1.5} strokeLinecap="round" />
                <text x={last && x2 - x1 < u.name.length * 6.4 ? x2 : x1} textAnchor={last && x2 - x1 < u.name.length * 6.4 ? "end" : "start"} y={16} className="fill-ink text-[11px] font-bold">
                  {text}
                </text>
              </g>
            );
          })}
          {links
            .sort((x, y) => Number(y.long) - Number(x.long))
            .map((e) => {
              const a = point(byId.get(e.from)!);
              const b = point(byId.get(e.to)!);
              const mx = (a.x + b.x) / 2;
              const on = shown !== null && (shown.id === e.from || shown.id === e.to);
              return (
                <path key={`${e.from}>${e.to}`} d={`M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`} fill="none" strokeLinecap="round" stroke={on ? "var(--ink-2)" : e.long ? "#e3dbc6" : "#d0c5ac"} strokeWidth={on ? 2.2 : e.long ? 1.2 : 1.8} />
              );
            })}
          {ordered.map((n, k) => {
            const p = point(n);
            const dim = theme !== null && n.theme !== theme;
            const label = `${n.kind === "checkpoint" ? "" : "Cours : "}${n.title}`;
            return (
              <g
                key={n.id}
                ref={(el) => {
                  if (el) refs.current.set(n.id, el);
                  else refs.current.delete(n.id);
                }}
                className="stop"
                style={{ opacity: dim ? 0.22 : 1, ["--k" as string]: k }}
                tabIndex={n.id === active ? 0 : -1}
                role="button"
                aria-label={label}
                onMouseEnter={() => setShown(n)}
                onFocus={() => {
                  setActive(n.id);
                  setShown(n);
                }}
                onClick={() => setShown(n)}
                onKeyDown={(e) => onKey(e, n.id)}
              >
                <Stop kind={n.kind} theme={n.theme} track={board.track} shared={n.shared} x={p.x} y={p.y} />
                <circle cx={p.x} cy={p.y} r={21} className="stop-halo" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid min-h-12 content-start justify-items-center gap-0.5 text-center" aria-live="polite">
        <b>{shown ? shown.title : "Touche une étape pour voir son titre."}</b>
        {shown && (
          <span className="text-sm text-muted">
            {themeOfLabel(shown)} · {unitName(shown.unit)}
            {shown.shared && " · commun à plusieurs parcours"}
          </span>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 border-t-[1.5px] border-line pt-3 text-sm" aria-label="Légende">
        {[
          ["Cours", "lesson" as const, false],
          ["Bilan", "checkpoint" as const, false],
          ["Projet final", "finale" as const, false],
          ["Commun à plusieurs parcours", "lesson" as const, true],
        ].map(([label, kind, shared]) => (
          <li key={String(label)} className="inline-flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="size-7" aria-hidden>
              <Stop kind={kind as LandingNode["kind"]} theme="comprendre" track={board.track} shared={Boolean(shared)} x={20} y={20} />
            </svg>
            {String(label)}
          </li>
        ))}
      </ul>
    </div>
  );
}
