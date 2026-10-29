"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { QuestionView, isDraftComplete, type Draft } from "@/components/quiz/QuestionView";
import { initialDraft, initialOrder } from "@/components/quiz/QuizRunner";
import type { Answer, TrackId } from "@/content/types";
import { PLACEMENT_LENGTH, gradePlacement, placementTest, type PlacementAnswer } from "@/lib/placement";

export type PlacementResult = { track: TrackId; score: number; chapters: string[]; answers: PlacementAnswer[] };

/**
 * One track's test: 10 questions in a fixed order. Nothing is corrected during the test. Arrows go back and
 * forth, an answer can be changed until the end, and "Je ne sais pas" is a real answer. The server grades
 * the answers again; the score here only drives the result screen. Loaded on demand: the question bank and
 * its answers stay out of the first download.
 */
export default function PlacementRun({ track, onDone, compact = false }: { track: TrackId; onDone: (r: PlacementResult) => void; compact?: boolean }) {
  const [seed] = useState(() => Math.random().toString(36).slice(2));
  const questions = useMemo(() => placementTest(track, seed), [track, seed]);
  const [index, setIndex] = useState(0);
  // undefined: not answered yet · null: "je ne sais pas"
  const [answers, setAnswers] = useState<Record<string, Answer | null>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [confirm, setConfirm] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const q = questions[index];
  const draft = q.id in drafts ? drafts[q.id] : initialDraft(q);
  const order = useMemo(() => initialOrder(q), [q]);
  const answeredCount = questions.filter((x) => x.id in answers).length;
  const missing = questions.filter((x) => !(x.id in answers));

  useEffect(() => {
    if (!compact) window.scrollTo({ top: 0 });
    else top.current?.scrollIntoView({ block: "nearest" });
  }, [index, compact]);

  function finish(final: Record<string, Answer | null>) {
    const list = questions.map((x) => ({ id: x.id, answer: x.id in final ? final[x.id] : null }));
    const graded = gradePlacement(track, list);
    onDone({ track, score: graded.score, chapters: graded.chapters, answers: list });
  }

  function go(to: number) {
    setConfirm(false);
    setIndex(Math.max(0, Math.min(questions.length - 1, to)));
  }

  function answer(value: Answer | null) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (index < questions.length - 1) return go(index + 1);
    const left = questions.filter((x) => !(x.id in next));
    if (left.length) setConfirm(true);
    else finish(next);
  }

  return (
    <div ref={top} className="grid scroll-mt-24 gap-6" data-track={track}>
      <div className="flex items-center gap-3">
        <Avatar track={track} size={34} mood="think" decorative />
        <div className="flex flex-1 gap-1" role="progressbar" aria-label="Avancement du test" aria-valuemin={0} aria-valuemax={PLACEMENT_LENGTH} aria-valuenow={answeredCount}>
          {questions.map((x, i) => (
            <i
              key={x.id}
              className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${i === index ? "bg-accent shadow-[inset_0_-2px_0_var(--accent-deep)]" : x.id in answers ? "bg-ink" : "bg-sunk"}`}
            />
          ))}
        </div>
        <span className="tabular text-sm font-semibold" aria-live="polite">
          {index + 1}/{PLACEMENT_LENGTH}
        </span>
      </div>

      <div key={q.id} className="fade-in grid gap-6">
        <QuestionView question={q} draft={draft} setDraft={(d) => setDrafts((all) => ({ ...all, [q.id]: d }))} reveal={null} displayOrder={order} />
      </div>

      {confirm ? (
        <div className="fade-in tile grid gap-3 p-4 sm:p-5" role="alert">
          <p className="font-semibold">
            {missing.length} question{missing.length > 1 ? "s" : ""} sans réponse. Elle{missing.length > 1 ? "s compteront" : " comptera"} comme « Je ne sais pas ».
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={() => go(questions.indexOf(missing[0]))}>Y revenir</button>
            <button className="btn btn-primary" onClick={() => finish(answers)}>Voir mon résultat</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <button className="nav-arrow" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Question précédente">
              <ChevronLeft className="size-6" strokeWidth={2.6} aria-hidden />
            </button>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
              <button className="btn btn-primary" disabled={!isDraftComplete(q, draft)} onClick={() => answer(draft as Answer)}>
                {index === questions.length - 1 ? "Valider et voir" : "Valider"}
              </button>
              <button className="btn btn-ghost" onClick={() => answer(null)}>Je ne sais pas</button>
            </div>
            <button className="nav-arrow" onClick={() => go(index + 1)} disabled={index === questions.length - 1} aria-label="Question suivante">
              <ChevronRight className="size-6" strokeWidth={2.6} aria-hidden />
            </button>
          </div>
          {q.id in answers && <p className="text-center text-sm text-muted">Déjà répondue : tu peux changer ta réponse.</p>}
        </div>
      )}
    </div>
  );
}
