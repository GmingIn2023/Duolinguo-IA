"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, Flag, Lock, Star, Trophy, X } from "lucide-react";
import { DIFFICULTY_LABEL } from "@/content/curriculum";
import type { Track, TrackId } from "@/content/types";
import { Avatar } from "@/components/Avatar";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { edgePath, layoutBoard, type Orientation } from "@/lib/board";
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

/**
 * The progression board: a branching path drawn left to right on wide screens, top to bottom on phones.
 * Tapping a token opens its card; the recommended token pulses and carries the mascot.
 */
export function Board({ track, items, mascot, free = false }: { track: Track; items: BoardItem[]; mascot: TrackId; free?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const selected = items.find((i) => i.id === open) ?? null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div data-track={track.id}>
      <div className="hidden md:block">
        <Canvas track={track} items={items} mascot={mascot} free={free} orientation="horizontal" open={open} setOpen={setOpen} />
      </div>
      <div className="md:hidden">
        <Canvas track={track} items={items} mascot={mascot} free={free} orientation="vertical" open={open} setOpen={setOpen} />
      </div>
      {selected && <NodeCard item={selected} onClose={() => setOpen(null)} />}
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
  const { points, size, units } = useMemo(() => layoutBoard(track, orientation), [track, orientation]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const scroller = useRef<HTMLDivElement>(null);
  const horizontal = orientation === "horizontal";
  const sizes = horizontal ? SIZE : SIZE_SM;
  const done = (i?: BoardItem) => i?.status === "completed" || i?.status === "covered";
  const target = items.find((i) => i.status === "recommended");

  // bring the recommended step into view on arrival
  useEffect(() => {
    const el = scroller.current;
    const p = target && points.get(target.id);
    if (!el || !p || !el.offsetParent) return;
    if (horizontal) el.scrollTo({ left: Math.max(0, p.x - el.clientWidth / 2) });
    else window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY + p.y - window.innerHeight / 2) });
  }, [target, points, horizontal]);

  return (
    <div ref={scroller} className={`board-ground relative rounded-3xl shadow-[inset_0_0_0_1.5px_var(--line)] ${horizontal ? "no-scrollbar overflow-x-auto" : "mx-auto overflow-hidden"}`} style={horizontal ? undefined : { width: size.width + 16, maxWidth: "100%" }}>
      <div className="relative mx-auto" style={{ width: size.width, height: size.height }}>
        {/* unit bands */}
        {units.map(({ unit, from, to }, n) => (
          <div
            key={unit.id}
            className="pointer-events-none absolute"
            style={horizontal ? { left: from, width: to - from, top: 0, bottom: 0 } : { top: from, height: to - from, left: 0, right: 0 }}
          >
            {n > 0 && <div className={`absolute border-dashed border-edge ${horizontal ? "inset-y-4 left-0 border-l-2" : "inset-x-3 top-0 border-t-2"}`} />}
          </div>
        ))}

        <svg className="absolute inset-0" width={size.width} height={size.height} aria-hidden>
          {items.flatMap((i) =>
            i.from.map((fromId) => {
              const a = points.get(fromId);
              const b = points.get(i.id);
              if (!a || !b) return null;
              const state = done(byId.get(fromId)) && done(i) ? "done" : done(byId.get(fromId)) && i.status === "recommended" ? "next" : undefined;
              const d = edgePath(a, b, orientation);
              return (
                <g key={`${fromId}>${i.id}`}>
                  <path d={d} className="board-edge" data-state={state} style={horizontal ? undefined : { strokeWidth: 9 }} />
                  <path d={d} className="board-edge-dots" data-state={state} />
                </g>
              );
            }),
          )}
        </svg>

        {/* unit names sit above the path so lines never cross them */}
        {units.map(({ unit, from }) => (
          <p
            key={unit.id}
            className="pointer-events-none absolute rounded-md bg-surface/95 px-1.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-muted"
            style={horizontal ? { left: from + 12, top: 10 } : { top: from + 4, left: 8 }}
          >
            {unit.name}
          </p>
        ))}

        {items.map((i) => {
          const p = points.get(i.id)!;
          const s = sizes[i.kind];
          const recommended = i.status === "recommended" && !free;
          return (
            <div key={i.id}>
              <button
                type="button"
                className="token"
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
              {recommended && (
                <div className="you-are-here pointer-events-none absolute" style={{ left: p.x + s / 2 - 6, top: p.y - s / 2 - (horizontal ? 40 : 34) }}>
                  <Avatar track={mascot} size={horizontal ? 40 : 34} />
                </div>
              )}
              {horizontal ? (
                <span className="token-label" data-status={i.status} style={{ left: p.x, top: p.y + s / 2 + 10 }}>
                  {i.title}
                </span>
              ) : (
                recommended && (
                  <span className="token-label !w-32 rounded-lg bg-surface/90 px-1.5 py-0.5" style={{ left: p.x, top: p.y + s / 2 + 6 }}>
                    {i.title}
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
  const cta =
    item.kind === "checkpoint"
      ? item.status === "completed" ? "Refaire le bilan" : "Passer le bilan"
      : item.status === "completed" ? "Revoir le cours"
      : item.status === "covered" ? "Faire le cours quand même"
      : item.resumeAt !== undefined ? "Reprendre" : "Commencer";
  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-3 lg:bottom-6 lg:left-[16rem] lg:px-12" role="dialog" aria-label={item.title}>
      <div data-theme={item.theme ?? "projets"} className="sheet-in tile mx-auto grid max-w-xl gap-4 p-5 shadow-[0_5px_0_var(--edge),0_20px_50px_-20px_rgb(0_0_0/0.35)] sm:p-6">
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
        {item.kind === "checkpoint" && !locked && <p className="text-ink-2">Les notions des cours de cette étape reviennent sous une autre forme. +20 XP la première fois.</p>}
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
