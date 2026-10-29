"use client";

import { useEffect, useState } from "react";
import { Flame, Zap } from "lucide-react";
import type { TrackId } from "@/content/types";
import { playSound } from "@/lib/sound";
import { Avatar } from "./Avatar";

const PIECES = Array.from({ length: 18 }, (_, i) => i);
const COLORS = ["var(--bird)", "var(--gecko)", "var(--fox)", "var(--sky)", "var(--lilac)", "var(--rose)"];

/**
 * The end of a lesson: the mascot jumps, a short burst of flat paper pieces, the XP counts up.
 * One moment, about a second long; under reduced motion or calm mode it is simply there.
 */
export function Celebration({
  track,
  xp,
  title,
  line,
  stats,
  sounds,
}: {
  track: TrackId;
  xp: number;
  title: string;
  line: string;
  stats: { label: string; value: string; icon?: "xp" | "streak" }[];
  sounds: boolean;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (sounds) playSound("done");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.querySelector('[data-motion="calm"]');
    if (reduce || xp <= 0) {
      setShown(xp);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(Math.round(xp * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [xp, sounds]);

  return (
    <div className="grid justify-items-center gap-5 text-center">
      <div className="relative">
        <div className="celebrate-burst" aria-hidden>
          {PIECES.map((i) => {
            const angle = (i / PIECES.length) * Math.PI * 2;
            const dist = 90 + (i % 3) * 28;
            return (
              <i
                key={i}
                className="confetti"
                style={{
                  left: "50%",
                  top: "45%",
                  background: COLORS[i % COLORS.length],
                  borderRadius: i % 2 ? "999px" : "3px",
                  ["--dx" as string]: `${Math.cos(angle) * dist}px`,
                  ["--dy" as string]: `${Math.sin(angle) * dist - 30}px`,
                  ["--rot" as string]: `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
                  animationDelay: `${120 + (i % 4) * 30}ms`,
                }}
              />
            );
          })}
        </div>
        <Avatar track={track} mood="cheer" size={150} animate />
      </div>
      <p className="bubble pop-in">{line}</p>
      <h1 className="display display-l">{title}</h1>
      <p className="display tabular text-[clamp(3.5rem,12vw,6rem)] leading-none text-ink" aria-label={`${xp} XP gagnés`}>
        +{shown}
        <span className="ml-2 text-[0.45em] text-muted">XP</span>
      </p>
      <dl className="grid w-full max-w-md grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="tile p-3">
            <dt className="flex items-center justify-center gap-1 text-xs font-medium text-muted">
              {s.icon === "streak" && <Flame className="size-3.5" aria-hidden />}
              {s.icon === "xp" && <Zap className="size-3.5" aria-hidden />}
              {s.label}
            </dt>
            <dd className="tabular mt-1 text-lg font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
