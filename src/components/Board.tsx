"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Clock, Flag, Lock, Star, Trophy, X } from "lucide-react";
import { DIFFICULTY_LABEL } from "@/content/curriculum";
import type { Track, TrackId } from "@/content/types";
import { Avatar } from "@/components/Avatar";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { BOARD, edgePath, layoutBoard, type Orientation, type Point } from "@/lib/board";
import { itemHref, type BoardItem } from "@/lib/boardView";
import { FORMAT_LABEL, formatMinutes } from "@/lib/labels";

const STATUS_TEXT: Record<BoardItem["status"], string> = {
  completed: "Terminé",
  covered: "Validé par ton test de niveau",
  recommended: "Conseillé maintenant",
  available: "Ouvert",
  locked: "Verrouillé",
};

const SIZE = { lesson: 64, checkpoint: 56, finale: 84 } as const;
const SIZE_SM = { lesson: 52, checkpoint: 46, finale: 66 } as const;
/** On phones the board stretches across the available width, up to this. */
const VERTICAL_MAX = 440;
/** Space kept between the outermost tokens and the board's side. */
const VERTICAL_PAD = 44;

/**
 * The progression board: a branching path drawn left to right on wide screens, top to bottom on phones.
 * Tapping a token opens its card; the recommended token pulses and carries the mascot.
 */
export function Board({ track, items, mascot, free = false }: { track: Track; items: BoardItem[]; mascot: TrackId; free?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const selected = items.find((i) => i.id === open) ?? null;

  const close = () => {
    const id = open;
    setOpen(null);
    // give focus back to the visible token that opened the card
    if (id) document.querySelectorAll<HTMLElement>(`[data-node="${id}"]`).forEach((el) => el.offsetParent && el.focus());
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div data-track={track.id}>
      <div className="hidden md:block">
        <Canvas track={track} items={items} mascot={mascot} free={free} orientation="horizontal" open={open} setOpen={setOpen} />
      </div>
      <div className="md:hidden">
        <Canvas track={track} items={items} mascot={mascot} free={free} orientation="vertical" open={open} setOpen={setOpen} />
      </div>
      {selected && <NodeCard key={selected.id} item={selected} onClose={close} />}
    </div>
  );
}

function Canvas({
  track,
  items,
  mascot,
  free,
  orientation,
  open,
  setOpen,
}: {
  track: Track;
  items: BoardItem[];
  mascot: TrackId;
  free: boolean;
  orientation: Orientation;
  open: string | null;
  setOpen: (id: string | null) => void;
}) {
  const layout = useMemo(() => layoutBoard(track, orientation), [track, orientation]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const scroller = useRef<HTMLDivElement>(null);
  const horizontal = orientation === "horizontal";
  const sizes = horizontal ? SIZE : SIZE_SM;
  const done = (i?: BoardItem) => i?.status === "completed" || i?.status === "covered";
  const target = items.find((i) => i.status === "recommended");

  // Phones: spread the lanes over the width actually available instead of a fixed narrow column.
  const [avail, setAvail] = useState<number | null>(null);
  useEffect(() => {
    const el = scroller.current?.parentElement;
    if (horizontal || !el) return;
    const ro = new ResizeObserver(() => setAvail(Math.min(VERTICAL_MAX, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [horizontal]);

  const { points, size, units } = useMemo(() => {
    if (horizontal || !avail || avail <= layout.size.width) return layout;
    const pad = BOARD.vertical.padCross;
    const k = (avail - 2 * VERTICAL_PAD) / (layout.size.width - 2 * pad);
    const spread = new Map<string, Point>();
    layout.points.forEach((p, id) => spread.set(id, { x: VERTICAL_PAD + (p.x - pad) * k, y: p.y }));
    return { ...layout, points: spread, size: { width: avail, height: layout.size.height } };
  }, [layout, avail, horizontal]);

  // bring the recommended step into view on arrival (not on every resize)
  const targetPoint = target ? layout.points.get(target.id) : undefined;
  useEffect(() => {
    const el = scroller.current;
    const p = targetPoint;
    if (!el || !p || !el.offsetParent) return;
    if (horizontal) el.scrollTo({ left: Math.max(0, p.x - el.clientWidth / 2) });
    else window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY + p.y - window.innerHeight / 2) });
  }, [targetPoint, horizontal]);

  /*
   * Edges. A link between neighbouring columns is drawn at full weight; a long link that jumps over
   * several columns is only a hint (thin, no dots) so forks stay readable, unless it touches the open token.
   */
  const step = BOARD[orientation].stepMain;
  const edges = items
    .flatMap((i) =>
      i.from.map((fromId) => {
        const a = points.get(fromId);
        const b = points.get(i.id);
        if (!a || !b) return null;
        const span = Math.abs(horizontal ? b.x - a.x : b.y - a.y);
        const state = done(byId.get(fromId)) && done(i) ? "done" : done(byId.get(fromId)) && i.status === "recommended" ? "next" : undefined;
        const focus = open !== null && (open === i.id || open === fromId);
        const long = span > step * 1.5 && !focus && state !== "next";
        return { key: `${fromId}>${i.id}`, d: edgePath(a, b, orientation), state, long, focus };
      }),
    )
    .filter((e) => e !== null)
    .sort((a, b) => Number(b.long) - Number(a.long) || Number(a.focus) - Number(b.focus));

  /** Lessons done per unit, shown next to the unit name. */
  const unitCount = (unitId: string) => {
    const lessons = items.filter((i) => i.unit === unitId && i.kind !== "checkpoint");
    return `${lessons.filter(done).length}/${lessons.length}`;
  };

  // Phones: only the next step and the open token carry their title, on a tag that sits above the lines.
  const tagged = new Set([...(target && !free ? [target.id] : []), ...(open ? [open] : [])]);
  const clampX = (x: number) => Math.min(Math.max(x, 90), size.width - 90);

  return (
    <div
      ref={scroller}
      className={`board-ground relative rounded-3xl shadow-[inset_0_0_0_1.5px_var(--line)] ${horizontal ? "no-scrollbar overflow-x-auto" : "mx-auto overflow-hidden"}`}
      style={horizontal ? undefined : { width: size.width, maxWidth: "100%" }}
    >
      <div className="relative mx-auto" style={{ width: size.width, height: size.height }}>
        {/* unit dividers */}
        {units.map(({ unit, from }, n) =>
          n > 0 ? (
            <div
              key={unit.id}
              aria-hidden
              className={`pointer-events-none absolute border-dashed border-edge ${horizontal ? "inset-y-4 border-l-2" : "inset-x-3 border-t-2"}`}
              style={horizontal ? { left: from } : { top: from }}
            />
          ) : null,
        )}

        <svg className="absolute inset-0" width={size.width} height={size.height} aria-hidden>
          {edges.map((e) => (
            <g key={e.key}>
              <path
                d={e.d}
                className="board-edge"
                data-state={e.state}
                data-long={e.long || undefined}
                style={horizontal || e.long ? undefined : { strokeWidth: 9 }}
              />
              {!e.long && <path d={e.d} className="board-edge-dots" data-state={e.state} />}
            </g>
          ))}
        </svg>

        {/* unit names: a tag on the divider, above the lines */}
        {units.map(({ unit, from }, n) => (
          <p
            key={unit.id}
            className="pointer-events-none absolute z-[1] flex items-baseline gap-1.5 rounded-lg bg-surface px-2 py-0.5 text-[0.8125rem] font-semibold text-ink-2 shadow-[inset_0_0_0_1.5px_var(--line)]"
            style={horizontal ? { left: from + 12, top: 12 } : { top: n === 0 ? 10 : from - 12, left: 12, maxWidth: size.width - 24 }}
          >
            <span className="truncate">{unit.name}</span>
            <span className="tabular flex-none text-[0.75rem] font-medium text-muted">{unitCount(unit.id)}</span>
          </p>
        ))}

        {items.map((i) => {
          const p = points.get(i.id)!;
          const s = sizes[i.kind];
          const recommended = i.status === "recommended" && !free;
          const tagStyle: CSSProperties = { left: clampX(p.x), top: p.y + s / 2 + 8 };
          return (
            <div key={i.id}>
              <button
                type="button"
                className="token"
                data-node={i.id}
                data-status={i.status === "recommended" ? "available" : i.status}
                data-theme={i.theme ?? "projets"}
                aria-expanded={open === i.id}
                aria-label={`${i.title}. ${STATUS_TEXT[i.status]}`}
                onClick={() => setOpen(open === i.id ? null : i.id)}
                style={{ left: p.x, top: p.y, width: s, height: s }}
              >
                {recommended && <span className="token-ring" />}
                <span className={`token-face ${i.kind === "checkpoint" ? "!rounded-2xl rotate-45" : ""}`}>
                  <span className={i.kind === "checkpoint" ? "-rotate-45" : ""}>
                    <TokenIcon item={i} size={Math.round(s * 0.42)} />
                  </span>
                </span>
              </button>
              {horizontal ? (
                <>
                  {recommended && (
                    <div className="you-are-here pointer-events-none absolute" style={{ left: p.x + s / 2 - 6, top: p.y - s / 2 - 40 }}>
                      <Avatar track={mascot} size={40} />
                    </div>
                  )}
                  <span className="token-label rounded-md bg-surface/85 px-1 py-0.5" data-status={i.status} style={{ left: p.x, top: p.y + s / 2 + 8 }}>
                    {i.title}
                  </span>
                </>
              ) : (
                tagged.has(i.id) && (
                  <span
                    aria-hidden
                    className="token-label z-[2] flex !w-max max-w-[11rem] items-center gap-1.5 rounded-lg bg-surface px-2 py-1 text-left shadow-[inset_0_0_0_1.5px_var(--line),0_2px_0_var(--edge)]"
                    data-status={i.status}
                    style={tagStyle}
                  >
                    {recommended && (
                      <span className="flex-none">
                        <Avatar track={mascot} size={22} />
                      </span>
                    )}
                    <span className="line-clamp-2">{i.title}</span>
                  </span>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TokenIcon({ item, size }: { item: BoardItem; size: number }) {
  if (item.status === "locked") return <Lock size={size * 0.85} strokeWidth={2.2} aria-hidden />;
  if (item.status === "completed") return <Check size={size} strokeWidth={3} aria-hidden />;
  if (item.kind === "checkpoint") return <Flag size={size * 0.9} strokeWidth={2.2} aria-hidden />;
  if (item.kind === "finale") return <Trophy size={size} strokeWidth={2} aria-hidden />;
  if (item.status === "covered") return <Star size={size * 0.9} strokeWidth={2.2} aria-hidden />;
  return item.theme ? <ThemeGlyph theme={item.theme} size={size} /> : null;
}

function NodeCard({ item, onClose }: { item: BoardItem; onClose: () => void }) {
  const locked = item.status === "locked";
  const card = useRef<HTMLDivElement>(null);
  // keyboard users land in the card; Escape or "Fermer" brings them back to the token
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    // keep the tapped token (and its title tag) visible above the card
    const token = [...document.querySelectorAll<HTMLElement>(`[data-node="${item.id}"]`)].find((t) => t.offsetParent);
    if (!token) return;
    const t = token.getBoundingClientRect();
    // the dialog wrapper, not the card: the card is still sliding in (transformed)
    const cardTop = (el.parentElement ?? el).getBoundingClientRect().top;
    if (t.bottom + 56 > cardTop) {
      const delta = (t.top + t.bottom) / 2 - Math.max(cardTop / 2, 96);
      window.scrollBy({ top: delta, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [item.id]);
  const cta =
    item.kind === "checkpoint"
      ? item.status === "completed" ? "Refaire le bilan" : "Passer le bilan"
      : item.status === "completed" ? "Revoir le cours"
      : item.status === "covered" ? "Faire le cours quand même"
      : item.resumeAt !== undefined ? "Reprendre" : "Commencer";
  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-3 lg:bottom-6 lg:left-[16rem] lg:px-12" role="dialog" aria-label={item.title}>
      <div ref={card} tabIndex={-1} data-theme={item.theme ?? "projets"} className="sheet-in tile mx-auto grid max-w-xl gap-4 p-5 shadow-[inset_0_0_0_1.5px_var(--line),0_5px_0_var(--edge)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid min-w-0 flex-1 gap-1.5">
            <p className="meta">
              {item.kind === "checkpoint" ? `Bilan · ${item.covers} cours` : item.kind === "finale" ? "Projet final" : `${FORMAT_LABEL[item.format!]} · ${DIFFICULTY_LABEL[item.difficulty!]}`}
              {item.durationMin ? <> · <Clock className="inline size-3.5 -translate-y-px" aria-hidden /> {formatMinutes(item.durationMin)}</> : null}
            </p>
            <h2 className="display display-s">{item.title}</h2>
          </div>
          <button type="button" className="icon-btn -mr-2 -mt-2" onClick={onClose} aria-label="Fermer">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {item.objective && <p className="text-ink-2">{item.objective}</p>}
        {item.kind === "checkpoint" && !locked && <p className="text-ink-2">Les notions des cours de cette étape reviennent. +20 XP la première fois, avec au moins 60 % de bonnes réponses.</p>}
        {item.status === "covered" && <p className="chip chip-th w-fit">Ton test de niveau l&apos;a validé : tu peux passer à la suite.</p>}
        {locked ? (
          <div className="grid gap-2 rounded-xl bg-sunk p-4">
            <p className="text-sm font-semibold">À faire avant :</p>
            <ul className="grid gap-1">
              {item.missing.map((m) => (
                <li key={m.id}>
                  <Link href={`/lesson/${m.id}`} className="font-medium underline">{m.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Link href={itemHref(item)} className="btn btn-primary btn-lg w-full sm:w-fit">{cta}</Link>
        )}
      </div>
    </div>
  );
}
