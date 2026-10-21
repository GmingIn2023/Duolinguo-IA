"use client";

import { useMemo, useRef, useState } from "react";
import { QuestionView, isDraftComplete, type Draft } from "@/components/quiz/QuestionView";
import { initialDraft, initialOrder } from "@/components/quiz/QuizRunner";
import type { Answer } from "@/content/types";
import { gradeAnswer } from "@/lib/grading";
import type { PlacementAnswer } from "@/lib/onboardingStorage";
import { PLACEMENT_LENGTH, levelName, nextPlacementQuestion, placementLevel } from "@/lib/placement";
import type { PlacementStep } from "@/lib/placement";

/**
 * The adaptive test itself, same engine as /onboarding: a right answer raises the next question's level,
 * a miss or "Je ne sais pas" lowers it, nothing is corrected during the test, and the server re-grades later.
 * Loaded on demand: the question bank (with its answers) is not part of the landing's first download.
 */
export type PlacementResult = { level10: number; levelLabel: string; answers: PlacementAnswer[] };

export default function PlacementRun({ onDone }: { onDone: (result: PlacementResult) => void }) {
  const [seed] = useState(() => Math.random().toString(36).slice(2));
  const [history, setHistory] = useState<PlacementStep[]>([]);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const question = useMemo(() => nextPlacementQuestion(history, seed), [history, seed]);
  const [draft, setDraft] = useState<Draft>(null);
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);
  if (question && draftFor !== question.id) {
    setDraftFor(question.id);
    setDraft(initialDraft(question));
  }
  const order = useMemo(() => (question ? initialOrder(question) : []), [question]);

  function answer(value: Answer | null) {
    if (!question) return;
    const correct = value !== null && gradeAnswer(question, value);
    const nextHistory = [...history, { id: question.id, correct }];
    const nextAnswers = [...answers, { id: question.id, answer: value }];
    setAnswers(nextAnswers);
    setHistory(nextHistory);
    if (nextPlacementQuestion(nextHistory, seed)) {
      top.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
      return;
    }
    const level10 = placementLevel(nextHistory);
    onDone({ level10, levelLabel: levelName(level10), answers: nextAnswers });
  }

  if (!question) return null;
  return (
    <div ref={top} className="grid gap-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" role="progressbar" aria-label="Avancement du test" aria-valuemin={0} aria-valuemax={PLACEMENT_LENGTH} aria-valuenow={history.length}>
          {Array.from({ length: PLACEMENT_LENGTH }, (_, i) => (
            <i key={i} className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${i < history.length ? "bg-ink" : i === history.length ? "bg-bird" : "bg-sunk"}`} />
          ))}
        </div>
        <span className="tabular text-sm font-semibold" aria-live="polite">Question {history.length + 1} sur {PLACEMENT_LENGTH}</span>
      </div>
      <div key={question.id} className="fade-in grid gap-6">
        <QuestionView question={question} draft={draft} setDraft={setDraft} reveal={null} displayOrder={order} />
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" disabled={!isDraftComplete(question, draft)} onClick={() => answer(draft)}>Valider</button>
          <button className="btn btn-ghost" onClick={() => answer(null)}>Je ne sais pas</button>
        </div>
      </div>
    </div>
  );
}
