"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { gaugeSegments } from "@/lib/placementFlow";
import type { LandingPreviews } from "@/lib/landingPreview";

const TRACK_COLOR = { bird: "var(--bird)", gecko: "var(--gecko)", fox: "var(--fox)" } as const;

/**
 * "Comment ça marche": a thread that draws itself as you scroll, four stops, each with a real preview.
 * The stops sit exactly on the curve (their positions are measured), the curve ends in a loop, and
 * under reduced motion the whole thing is already drawn.
 */
export function HowItWorks({ previews }: { previews: LandingPreviews }) {
  const trail = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const end = useRef<HTMLSpanElement>(null);
  const base = useRef<SVGPathElement>(null);
  const draw = useRef<SVGPathElement>(null);
  const curl = useRef<SVGPathElement>(null);
  const rider = useRef<SVGGElement>(null);
  const geometry = useRef({ total: 1, stops: [0, 0, 0, 0] });
  const [reached, setReached] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  /** Positions the path through the measured dots, then remembers how far along each stop is. */
  function build() {
    const t = trail.current;
    const b = base.current;
    const d = draw.current;
    if (!t || !b || !d || !end.current) return;
    const box = t.getBoundingClientRect();
    const centre = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
    };
    const pts = [...dots.current.filter((e): e is HTMLSpanElement => Boolean(e)).map(centre), centre(end.current)];
    let path = `M${pts[0].x} ${pts[0].y - 40} L${pts[0].x} ${pts[0].y}`;
    const prefixes = [path];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const c = pts[i];
      const my = (a.y + c.y) / 2;
      path += ` C${a.x} ${my} ${c.x} ${my} ${c.x} ${c.y}`;
      prefixes.push(path);
    }
    b.setAttribute("d", path);
    d.setAttribute("d", path);
    const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
    b.parentNode?.appendChild(probe);
    const stops = prefixes.slice(0, 4).map((p) => {
      probe.setAttribute("d", p);
      return probe.getTotalLength();
    });
    probe.remove();
    const total = b.getTotalLength();
    geometry.current = { total, stops };
    d.style.strokeDasharray = String(total);
    const r = 24;
    curl.current?.setAttribute("d", `M${pts[4].x} ${pts[4].y - r} a${r} ${r} 0 1 1 -0.1 0`);
    update();
  }

  function update() {
    const t = trail.current;
    const d = draw.current;
    const b = base.current;
    if (!t || !d || !b) return;
    const { total, stops } = geometry.current;
    const box = t.getBoundingClientRect();
    const p = reduced ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.6 - box.top) / (box.height * 0.92)));
    const len = p * total;
    d.style.strokeDashoffset = String(total - len);
    const count = reduced ? 4 : stops.filter((s) => len >= s - 4).length;
    setReached((prev) => (prev === count ? prev : count));
    const pt = b.getPointAtLength(Math.max(1, Math.min(total, len)));
    rider.current?.setAttribute("transform", `translate(${pt.x},${pt.y})`);
    if (rider.current) rider.current.style.opacity = p > 0.01 ? "1" : "0";
    if (curl.current) curl.current.style.opacity = reduced || len >= total - 4 ? "1" : "0";
  }

  useLayoutEffect(() => {
    build();
    const t = trail.current;
    if (!t) return;
    const ro = new ResizeObserver(() => build());
    ro.observe(t);
    const onScroll = () => requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.fonts?.ready.then(build).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    // build/update read refs and the reduced flag at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const stepClass = (i: number) => `how-step${reached > i ? " is-reached" : ""}`;

  return (
    <div className="how-trail" ref={trail}>
      <svg className="how-rail" aria-hidden>
        <path ref={base} className="how-base" />
        <path ref={draw} className="how-draw" />
        <path ref={curl} className="how-curl" />
        <g ref={rider} style={{ opacity: 0 }}>
          <g transform="translate(-17 -17)">
            <Avatar track="bird" size={34} />
          </g>
        </g>
      </svg>

      <article className={stepClass(0)}>
        <div className="how-copy">
          <span className="how-n">Étape 1 · Test de niveau</span>
          <h3>On voit ce que tu sais déjà.</h3>
          <p>Dix questions qui s&apos;adaptent. Tu sautes ce que tu maîtrises au lieu de le relire.</p>
        </div>
        <div className="how-dotc"><span className="how-dot" ref={(e) => { dots.current[0] = e; }} style={{ ["--dx" as string]: "-1.2rem" }}>1</span></div>
        <div className="how-card">
          <div className="how-cap"><span>Ton résultat</span><span>exemple</span></div>
          <p className="how-level">
            {previews.exampleLevel.level10}
            <small> sur 10 · {previews.exampleLevel.label}</small>
          </p>
          <div className="how-gauge" aria-hidden>
            {gaugeSegments(previews.exampleLevel.level10).map((s) => (
              <i key={s.index} style={s.filled ? { background: TRACK_COLOR[s.track], transitionDelay: `${150 + s.index * 70}ms` } : undefined} />
            ))}
          </div>
          <p className="text-sm">Parcours conseillé selon ton objectif : tu pars de là, et tu peux en changer.</p>
        </div>
      </article>

      <article className={stepClass(1)}>
        <div className="how-copy">
          <span className="how-n">Étape 2 · Cours à pratiquer</span>
          <h3>Tu lis, puis tu essaies pour de vrai.</h3>
          <p>Chaque cours a son exercice : écrire un prompt, vérifier une source, relire du code… selon le sujet. Les points importants sont surlignés et expliqués.</p>
        </div>
        <div className="how-dotc"><span className="how-dot" ref={(e) => { dots.current[1] = e; }} style={{ ["--dx" as string]: "1.2rem" }}>2</span></div>
        <BriefCard brief={previews.brief} />
      </article>

      <article className={stepClass(2)}>
        <div className="how-copy">
          <span className="how-n">Étape 3 · Quiz qui explique</span>
          <h3>Tu te trompes, on te dit pourquoi.</h3>
          <p>Tu vois la bonne réponse et la raison, pas seulement une croix rouge.</p>
        </div>
        <div className="how-dotc"><span className="how-dot" ref={(e) => { dots.current[2] = e; }} style={{ ["--dx" as string]: "-1.2rem" }}>3</span></div>
        <div className="how-card">
          <div className="how-cap"><span>Quiz · vrai ou faux</span><span>question réelle</span></div>
          {previews.quiz ? (
            <>
              <p className="how-q">{previews.quiz.statement}</p>
              <p className="how-ans how-ans-mine"><em>Ta réponse</em> Faux</p>
              <p className="how-ans how-ans-good"><em>Correct</em> Vrai</p>
              <p className="how-why">{previews.quiz.explanation}</p>
            </>
          ) : null}
        </div>
      </article>

      <article className={stepClass(3)}>
        <div className="how-copy">
          <span className="how-n">Étape 4 · Révisions</span>
          <h3>Ce que tu rates revient avant l&apos;oubli.</h3>
          <p>Une notion ratée revient plus tard, puis de plus en plus espacée. Ton carnet garde aussi tes notes.</p>
        </div>
        <div className="how-dotc"><span className="how-dot" ref={(e) => { dots.current[3] = e; }} style={{ ["--dx" as string]: "1.2rem" }}>4</span></div>
        <div className="how-card">
          <div className="how-cap"><span>Ta mémoire d&apos;une notion</span><span>exemple</span></div>
          <ForgettingCurve days={previews.reviewDays} />
          <p className="text-sm">Chaque point vert : la question revient. Plus tu la réussis, plus elle s&apos;éloigne.</p>
        </div>
      </article>

      <div className="how-again">
        <span className="how-end" ref={end} />
        <p className="hand">puis tu passes à la notion suivante</p>
      </div>
    </div>
  );
}

function BriefCard({ brief }: { brief: LandingPreviews["brief"] }) {
  const [open, setOpen] = useState(0);
  if (!brief) return <div className="how-card" />;
  return (
    <div className="how-card">
      <div className="how-cap"><span>Extrait du cours</span><span>{brief.lessonTitle}</span></div>
      <p className="how-brief">
        {brief.parts.map((p, i) => (
          <span key={p.label}>
            <button type="button" className="how-mark" data-k={i} aria-pressed={open === i} onClick={() => setOpen(i)}>{p.text}</button>{" "}
          </span>
        ))}
      </p>
      <div className="how-legend" role="group" aria-label="Parties du brief">
        {brief.parts.map((p, i) => (
          <button key={p.label} type="button" data-k={i} aria-pressed={open === i} onClick={() => setOpen(i)}>{p.label}</button>
        ))}
      </div>
      <p className="how-why" aria-live="polite"><strong>{brief.parts[open].label}.</strong> {brief.parts[open].detail}</p>
    </div>
  );
}

/** Memory drops, then jumps back at each review; the review days come from the real spaced-repetition intervals. */
function ForgettingCurve({ days }: { days: number[] }) {
  const W = 320;
  const H = 130;
  // reviews are spaced evenly on the drawing so the labels stay readable; the real day counts are in the labels
  const x = (i: number) => 64 + (i * (W - 96)) / Math.max(1, days.length - 1);
  let path = "M14 22";
  let prevX = 14;
  const marks: { x: number; y: number }[] = [];
  days.forEach((_, i) => {
    const dip = 92 - i * 6;
    const cx = x(i);
    path += ` C${prevX + (cx - prevX) * 0.25} ${48 + i * 6} ${prevX + (cx - prevX) * 0.7} ${dip - 4} ${cx} ${dip} L${cx} ${32 + i * 5}`;
    marks.push({ x: cx, y: 32 + i * 5 });
    prevX = cx;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="how-curve" role="img" aria-label={`Courbe de mémoire : la notion revient après ${days.map((d) => `${d} jour${d > 1 ? "s" : ""}`).join(", ")}.`}>
      <path d={`M12 ${H - 16}H${W - 8}`} stroke="#d9cfb8" strokeWidth={1.5} />
      <path d={path} className="how-fall" />
      {marks.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={5.5} className="how-rv" style={{ animationDelay: `${0.5 + i * 0.25}s` }} />
      ))}
      <text x={14} y={H - 3}>raté</text>
      {days.map((d, i) => (
        <text key={d} x={x(i)} y={H - 3} textAnchor="middle">
          +{d} j
        </text>
      ))}
    </svg>
  );
}
