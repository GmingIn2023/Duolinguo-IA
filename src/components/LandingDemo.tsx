"use client";

import { useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";

/** A real question from the "Hallucinations" lesson, playable on the landing page. */
export function LandingDemo() {
  const [picked, setPicked] = useState<boolean | null>(null);
  const correct = picked === false;
  return (
    <div className="tile grid gap-6 p-6 sm:p-8" data-track="fox">
      <p className="display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.08] tracking-[-0.025em]">«&nbsp;Une IA qui répond avec assurance a forcément raison.&nbsp;»</p>
      <p className="-mt-3 text-ink-2">Vrai ou faux&nbsp;? Une question du cours «&nbsp;Les hallucinations&nbsp;».</p>
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            className="choice justify-center text-lg font-semibold"
            aria-pressed={picked === v}
            data-state={picked === null ? undefined : v === false ? "correct" : picked === v ? "wrong" : undefined}
            disabled={picked !== null}
            onClick={() => setPicked(v)}
          >
            {v ? "Vrai" : "Faux"}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="empty:hidden">
        {picked !== null && (
          <div className="fade-in grid gap-1">
            <p className={`flex items-center gap-2 font-bold ${correct ? "text-good" : "text-bad"}`}>
              {correct ? <CircleCheck className="size-5" aria-hidden /> : <CircleX className="size-5" aria-hidden />}
              {correct ? "Juste !" : "Pas tout à fait : c'est faux."}
            </p>
            <p className="text-ink-2">Le ton est toujours assuré, même quand le contenu est inventé. C&apos;est ce qu&apos;on appelle une hallucination.</p>
          </div>
        )}
      </div>
    </div>
  );
}
