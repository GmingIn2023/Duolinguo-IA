"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { gazeOffset } from "@/lib/gaze";
import type { TrackId } from "@/content/types";

export type Guide = { id: TrackId; name: string; animal: string; audience: string; lessons: number };

/** What each guide says out loud: a situation the visitor may recognise, not an introduction. */
const SAYS: Record<TrackId, string> = {
  bird: "Je n'ai jamais vraiment osé lui écrire.",
  gecko: "Je m'en sers déjà, mais je tombe souvent à côté.",
  fox: "Je veux la brancher à mes outils et à mes données.",
};

const ROTATE_MS = 3800;

/**
 * The three tracks as three mascots. Each one is a link into the level test; one speech bubble shows at a time.
 * The mascot is never re-created on hover (that would cancel a tap in progress): the hop is pure CSS.
 */
export function HeroScene({ guides, href }: { guides: Guide[]; href: string }) {
  const sceneRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState<TrackId | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // bubbles take turns, and stop while someone is pointing at or focusing a guide
  useEffect(() => {
    if (reduced || engaged) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % guides.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [reduced, engaged, guides.length]);

  // eyes follow the pointer, one rAF per move, off under reduced motion
  useEffect(() => {
    if (reduced) return;
    const scene = sceneRef.current;
    if (!scene) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      scene.querySelectorAll<HTMLElement>("[data-guide]").forEach((guide) => {
        const box = guide.getBoundingClientRect();
        const { x: gx, y: gy } = gazeOffset(x - (box.left + box.width / 2), y - (box.top + box.height / 2));
        guide.style.setProperty("--gx", String(gx));
        guide.style.setProperty("--gy", String(gy));
      });
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div className="landing-scene" role="group" aria-label="Choisis ton guide">
      <span className="blob blob-main" aria-hidden />
      <span className="blob blob-sky" aria-hidden />
      <span className="blob blob-rose" aria-hidden />
      <ul role="list" aria-label="Les trois parcours" className="contents">
        {guides.map((g, i) => (
          <li key={g.id} role="listitem" className="contents">
            <Link
              href={href}
              data-guide
              data-track={g.id}
              className="guide guide-enter"
              aria-label={`${g.name}, ${g.audience}, ${g.lessons} cours`}
              onPointerEnter={() => { setEngaged(g.id); setActive(i); }}
              onPointerLeave={() => setEngaged(null)}
              onFocus={() => { setEngaged(g.id); setActive(i); }}
              onBlur={() => setEngaged(null)}
            >
              <span className="bubble-say" data-on={i === active} aria-hidden>{SAYS[g.id]}</span>
              <span className="guide-shadow" aria-hidden />
              <span className="guide-body"><Avatar track={g.id} size={220} /></span>
              <span className="guide-label" aria-hidden>{g.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="hand pointer-events-none absolute -bottom-1 left-[4%] flex items-center gap-2" aria-hidden>
        <svg width="40" height="30" viewBox="0 0 46 34" fill="none"><path d="M4 30C6 14 18 6 40 6M40 6l-9-5M40 6l-8 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>clique sur ton guide</span>
      </p>
    </div>
  );
}
