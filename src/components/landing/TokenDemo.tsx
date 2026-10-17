"use client";

import { useState } from "react";
import { TOKEN_CANDIDATES as CANDIDATES, TOKEN_START as START, pickCandidate } from "@/lib/tokenDemo";

export function TokenDemo() {
  // starts on the most likely word so the section is complete before any click, then each click draws again
  const [chosen, setChosen] = useState(0);
  const [rolls, setRolls] = useState(0);
  const c = CANDIDATES[chosen];

  return (
    <div className="tile grid gap-4 p-6 sm:p-8">
      <p className="display text-[clamp(1.35rem,2.4vw,1.9rem)] leading-[1.25] tracking-[-0.02em]" aria-live="polite" style={{ fontStretch: "112%" }}>
        {START} <span className="rounded-md bg-bird px-1">{c.word}</span> {c.tail}
      </p>
      <ul className="grid gap-2" aria-label="Les mots possibles et leur probabilité">
        {CANDIDATES.map((x, i) => (
          <li key={x.word} className="grid grid-cols-[5.6rem_1fr_3rem] items-center gap-3 text-[0.95rem]">
            <b className={i === chosen ? "w-fit rounded bg-bird px-1" : "w-fit px-1"}>{x.word}</b>
            <span className="h-3 overflow-hidden rounded-full bg-sunk">
              <i className="block h-full rounded-full bg-ink transition-[width] duration-700" style={{ width: `${x.p}%` }} />
            </span>
            <span className="tabular text-right text-muted">{x.p} %</span>
          </li>
        ))}
      </ul>
      <p className="min-h-12 font-semibold" aria-live="polite">
        {rolls === 0 ? "Voici la suite la plus probable. Relance pour voir une autre." : rolls < 3 ? "Toutes ces suites sont crédibles. Tu n'as pas la même qu'à l'essai d'avant." : "Même question, autre départ. Le modèle ne récite pas : il tire."}
      </p>
      <div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setChosen(pickCandidate(Math.random() * 100));
            setRolls((n) => n + 1);
          }}
        >
          Relancer
        </button>
      </div>
    </div>
  );
}
