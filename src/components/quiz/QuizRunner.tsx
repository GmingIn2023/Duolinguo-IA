"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleCheck, CircleX, RotateCcw } from "lucide-react";
import type { Answer, Question } from "@/content/types";
import { gradeAnswer } from "@/lib/grading";
import { seededShuffle, shuffleAway } from "@/lib/shuffle";
import { QuestionView, correctAnswerText, isDraftComplete, optionFeedback, type Draft, type Reveal } from "./QuestionView";

type Step = { question: Question; retry: boolean };

function initialOrder(q: Question): string[] {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
    case "ai_analysis":
      return seededShuffle(q.options.map((o) => o.id), q.id);
    case "ordering":
    case "ranking":
      return shuffleAway(q.items.map((i) => i.id), q.id);
    default:
      return [];
  }
}

function keyHint(q: Question): string {
  const n = "options" in q ? q.options.length : q.type === "true_false" ? 2 : 0;
  return n ? `Astuce : touches 1 à ${n} pour choisir, Entrée pour valider.` : "Astuce : flèches pour déplacer, Entrée pour valider.";
}

const initialDraft = (q: Question): Draft => (q.type === "ordering" || q.type === "ranking" ? initialOrder(q) : null);

/**
 * Runs a question set Duolingo-style: check → immediate correction → continue.
 * Questions missed on the first try come back at the end until answered correctly.
 * Reports first-attempt answers (what is graded and scheduled for spaced repetition).
 */
export function QuizRunner({
  questions,
  onDone,
  onProgress,
}: {
  questions: Question[];
  onDone: (firstAnswers: Record<string, Answer>) => void;
  onProgress?: (fraction: number) => void;
}) {
  const [queue, setQueue] = useState<Step[]>(() => questions.map((question) => ({ question, retry: false })));
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(questions[0]));
  const [reveal, setReveal] = useState<Reveal>(null);
  const [firstAnswers, setFirstAnswers] = useState<Record<string, Answer>>({});
  const [solved, setSolved] = useState(0);
  const [retryNotice, setRetryNotice] = useState(false);

  const step = queue[index];
  const order = useMemo(() => initialOrder(step.question), [step.question]);

  useEffect(() => onProgress?.(solved / questions.length), [solved, questions.length, onProgress]);

  // keep the marked answers visible above the correction sheet
  useEffect(() => {
    if (!reveal) return;
    const marked = document.querySelectorAll("[data-state]");
    marked[marked.length - 1]?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [reveal]);

  const check = useCallback(() => {
    if (reveal || !isDraftComplete(step.question, draft)) return;
    const answer = draft as Answer;
    const correct = gradeAnswer(step.question, answer);
    setReveal({ correct });
    if (!(step.question.id in firstAnswers)) setFirstAnswers((f) => ({ ...f, [step.question.id]: answer }));
    if (correct) setSolved((s) => s + 1);
    else setQueue((q) => [...q, { question: step.question, retry: true }]);
  }, [reveal, step, draft, firstAnswers]);

  const next = useCallback(() => {
    if (!reveal) return;
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      onDone(firstAnswers);
      return;
    }
    const nextStep = queue[nextIndex];
    if (nextStep.retry && !queue[index].retry) setRetryNotice(true);
    setIndex(nextIndex);
    setDraft(initialDraft(nextStep.question));
    setReveal(null);
  }, [reveal, index, queue, firstAnswers, onDone]);

  // Keyboard: 1–6 pick an option, Enter checks / continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (retryNotice) setRetryNotice(false);
        else if (reveal) next();
        else check();
        return;
      }
      if (!reveal && /^[1-6]$/.test(e.key)) {
        document.querySelector<HTMLButtonElement>(`[data-key="${e.key}"]:not(:disabled)`)?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [check, next, reveal, retryNotice]);

  if (retryNotice) {
    return (
      <div className="fade-in mx-auto grid max-w-xl justify-items-start gap-6 py-10">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent" aria-hidden>
          <RotateCcw className="size-7" />
        </span>
        <h2 className="display display-l">On reprend tes erreurs.</h2>
        <p className="lede">Les questions manquées reviennent maintenant. C&apos;est en corrigeant qu&apos;on retient le mieux.</p>
        <button className="btn btn-primary btn-lg" onClick={() => setRetryNotice(false)}>
          C&apos;est parti
        </button>
      </div>
    );
  }

  const q = step.question;
  const feedback = reveal && !reveal.correct && draft !== null ? optionFeedback(q, draft as Answer) : undefined;

  return (
    <div className={reveal ? "pb-[26rem] sm:pb-80" : "pb-48"}>
      <div key={`${q.id}-${index}`} className={`fade-in ${reveal && !reveal.correct ? "shake" : ""}`}>
        <QuestionView question={q} draft={draft} setDraft={setDraft} reveal={reveal} displayOrder={order} />
        {step.retry && <p className="mt-5 text-sm font-medium text-ink-2">Deuxième essai sur cette question.</p>}
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] ${
          !reveal ? "border-line bg-paper" : reveal.correct ? "sheet-in border-transparent bg-good-soft" : "sheet-in border-transparent bg-bad-soft"
        }`}
        role={reveal ? "status" : undefined}
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          {reveal ? (
            <div className="grid max-h-[40dvh] gap-1.5 overflow-y-auto">
              <p className={`flex items-center gap-2 text-lg font-bold ${reveal.correct ? "text-good" : "text-bad"}`}>
                {reveal.correct ? <CircleCheck className="size-6" aria-hidden /> : <CircleX className="size-6" aria-hidden />}
                {reveal.correct ? "Juste !" : "Pas tout à fait."}
              </p>
              {!reveal.correct && (
                <div className="text-[0.9375rem]">
                  <p className="font-semibold">Bonne réponse :</p>
                  <p className="whitespace-pre-line">{correctAnswerText(q)}</p>
                </div>
              )}
              {feedback && <p className="text-[0.9375rem] font-medium">{feedback}</p>}
              <p className="text-[0.9375rem] text-ink-2">{q.explanation}</p>
            </div>
          ) : (
            <p className="hidden text-sm text-muted sm:block">{keyHint(q)}</p>
          )}
          {reveal ? (
            <button className={`btn btn-lg flex-none sm:min-w-44 ${reveal.correct ? "bg-good text-white" : "bg-bad text-white"}`} onClick={next}>
              Continuer
            </button>
          ) : (
            <button className="btn btn-primary btn-lg flex-none sm:min-w-44" onClick={check} disabled={!isDraftComplete(q, draft)}>
              Vérifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
