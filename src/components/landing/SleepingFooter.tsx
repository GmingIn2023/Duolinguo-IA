"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, type Mood } from "@/components/Avatar";
import type { TrackId } from "@/content/types";

const ORDER: TrackId[] = ["bird", "gecko", "fox"];

/** The three mascots sleep at the bottom of the page and wake up one after the other when the footer comes into view. */
export function SleepingFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const [awake, setAwake] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    if (reduced || !("IntersectionObserver" in window)) {
      timers.push(window.setTimeout(() => setAwake(ORDER.length), 0));
      return () => timers.forEach(window.clearTimeout);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        ORDER.forEach((_, i) => timers.push(window.setTimeout(() => setAwake(i + 1), 250 + i * 220)));
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="flex items-end gap-4" aria-hidden>
      {ORDER.map((id, i) => {
        const mood: Mood = i < awake ? "happy" : "sleep";
        return (
          <span key={id} className="grid size-20 place-items-center rounded-3xl bg-paper sm:size-24">
            <Avatar track={id} size={64} mood={mood} />
          </span>
        );
      })}
      <span className="hand pb-2 text-bird transition-opacity duration-500" style={{ opacity: awake < ORDER.length ? 1 : 0 }}>zzz</span>
    </div>
  );
}
