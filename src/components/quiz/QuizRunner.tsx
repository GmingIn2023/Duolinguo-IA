"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleCheck, CircleX, RotateCcw } from "lucide-react";
import type { Answer, Question, TrackId } from "@/content/types";
import { gradeAnswer } from "@/lib/grading";
import { mascotLine } from "@/lib/mascot";
import { seededShuffle, shuffleAway } from "@/lib/shuffle";
import { Avatar } from "@/components/Avatar";
import { useLearnerPrefs } from "@/components/LearnerPrefs";
import { playSound } from "@/lib/sound";
import { renderInline } from "@/components/Rich";
import { QuestionView, correctAnswerText, isDraftComplete, optionFeedback, type Draft, type Reveal } from "./QuestionView";

type Step = { question: Question; retry: boolean };

export function initialOrder(q: Question): string[] {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
    case "ai_analysis":
    case "multi":
      return seededShuffle(q.options.map((o) => o.id), q.id);
    case "ordering":
    case "ranking":
      return shuffleAway(q.items.map((i) => i.id), q.id);
    case "match":
      return seededShuffle(q.right.map((r) => r.id), q.id);
    case "sort":
      return seededShuffle(q.items.map((i) => i.id), q.id);
    default:
      return [];
  }
}

export function initialDraft(q: Question): Draft {
  if (q.type === "ordering" || q.type === "ranking") return initialOrder(q);
  if (q.type === "match") return q.left.map(() => "");
  if (q.type === "sort") return q.items.map(() => "");
  return null;
}

function keyHint(q: Question): string {
  switch (q.type) {
    case "ordering":
    case "ranking":
      return "Astuce : flèches pour déplacer, Entrée pour valider.";
    case "match":
      return "Astuce : touche un élément, puis son partenaire. Entrée pour valider.";
    case "written":
      return "Astuce : Ctrl + Entrée pour valider.";
    case "sort":
      return "Astuce : range chaque carte, puis Entrée pour valider.";
    default: {
      const n = "options" in q ? q.options.length : 2;
      return `Astuce : touches 1 à ${n} pour choisir, Entrée pour valider.`;
    }
  }
}

/**
 * Runs a question set Duolingo-style: check → immediate correction → continue.
 * Questions missed on the first try come back at the end until answered correctly.
 * Reports first-attempt answers (what is graded and scheduled for spaced repetition).
 * `compact`: a single ungraded check inside a lesson (inline correction, no retry loop, no global shortcuts).
 */
export function QuizRunner({
  questions,
  track,
  onDone,
  onProgress,
  compact = false,
}: {
  questions: Question[];
  track: TrackId;
  onDone: (firstAnswers: Record<string, Answer>) => void;
  onProgress?: (fraction: number) => void;
  compact?: boolean;
}) {
  const [queue, setQueue] = useState<Step[]>(() => questions.map((question) => ({ question, retry: false })));
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(questions[0]));
  const [reveal, setReveal] = useState<Reveal>(null);
  const [firstAnswers, setFirstAnswers] = useState<Record<string, Answer>>({});
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [line, setLine] = useState("");
  const [retryNotice, setRetryNotice] = useState(false);
  const { sounds } = useLearnerPrefs();
  const sheet = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(0);

  const step = queue[index];
  const order = useMemo(() => initialOrder(step.question), [step.question]);

  useEffect(() => onProgress?.(solved / questions.length), [solved, questions.length, onProgress]);

  // keep the marked answers visible just above the correction sheet, whatever its height
  useEffect(() => {
    if (!reveal || compact) return;
    const h = sheet.current?.offsetHeight ?? 0;
    setSheetHeight(h);
    const marked = document.querySelectorAll("[data-state]");
    const last = marked[marked.length - 1];
    if (!last) return;
    const bottom = last.getBoundingClientRect().bottom;
    const room = window.innerHeight - h - 16;
    if (bottom > room) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // requestAnimationFrame: the extra bottom padding must be laid out before scrolling into it
      requestAnimationFrame(() => window.scrollBy({ top: bottom - room, behavior: smooth ? "smooth" : "auto" }));
    }
  }, [reveal, compact]);

  const check = useCallback(() => {
    if (reveal || !isDraftComplete(step.question, draft)) return;
    const answer = draft as Answer;
    const correct = gradeAnswer(step.question, answer);
    const nextStreak = correct ? streak + 1 : 0;
    const moment = !correct ? "wrong" : nextStreak % 3 === 0 ? "streak" : "correct";
    setStreak(nextStreak);
    setLine(mascotLine(track, moment, index));
    setReveal({ correct });
    if (sounds) playSound(correct ? "right" : "wrong");
    // inside a lesson, the correction is enough: the lesson's own "Suivant" moves on
    if (compact) onDone({ ...firstAnswers, [step.question.id]: answer });
    if (!(step.question.id in firstAnswers)) setFirstAnswers((f) => ({ ...f, [step.question.id]: answer }));
    if (correct) setSolved((s) => s + 1);
    else if (!compact) setQueue((q) => [...q, { question: step.question, retry: true }]);
  }, [reveal, step, draft, firstAnswers, streak, track, index, compact, sounds, onDone]);

  /** A written question can be passed: it counts as missed, shows the model answer, and does not come back. */
  const skip = useCallback(() => {
    if (reveal) return;
    if (compact) {
      onDone(firstAnswers);
      return;
    }
    setStreak(0);
    setLine("On passe. Voici une réponse possible.");
    setReveal({ correct: false, skipped: true });
    if (!(step.question.id in firstAnswers)) setFirstAnswers((f) => ({ ...f, [step.question.id]: "" }));
  }, [reveal, compact, onDone, firstAnswers, step]);

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

  // Keyboard: digits pick an option, Enter checks / continues (Ctrl+Enter inside a text field).
  useEffect(() => {
    if (compact) return;
    const onKey = (e: KeyboardEvent) => {
      const inField = e.target instanceof HTMLElement && e.target.closest("input, textarea");
      if (e.key === "Enter") {
        if (inField && !(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        if (retryNotice) setRetryNotice(false);
        else if (reveal) next();
        else check();
        return;
      }
      if (inField) return;
      if (!reveal && !retryNotice && /^[1-9]$/.test(e.key)) {
        document.querySelector<HTMLButtonElement>(`[data-key="${e.key}"]:not(:disabled)`)?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [check, next, reveal, retryNotice, compact]);

  if (retryNotice) {
    return (
      <div className="fade-in mx-auto grid max-w-xl justify-items-start gap-6 py-10">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent" aria-hidden>
          <RotateCcw className="size-7" />
        </span>
        <h2 className="display display-l">On la reprend.</h2>
        <p className="lede">Les questions manquées reviennent maintenant. C&apos;est en corrigeant qu&apos;on retient le mieux.</p>
        <button className="btn btn-primary btn-lg" onClick={() => setRetryNotice(false)}>
          C&apos;est parti
        </button>
      </div>
    );
  }

  const q = step.question;
  const feedback = reveal && !reveal.correct && draft !== null ? optionFeedback(q, draft as Answer) : undefined;
  const written = q.type === "written";
  const verdict = reveal
    ? reveal.skipped
      ? "Question passée."
      : reveal.correct
        ? written ? "Les idées y sont." : "Juste !"
        : written ? "Il manque des idées." : "Pas tout à fait."
    : "";

  const tone = !reveal ? "border-line bg-paper" : reveal.correct ? "sheet-in border-transparent bg-good-soft" : "sheet-in border-transparent bg-bad-soft";
  const blockBtn = compact ? "btn-block sm:w-auto" : "";

  const panel = (
    <div className={compact ? "grid gap-4" : "mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between"}>
      {reveal ? (
        <div className={`grid gap-2 ${compact ? "" : "max-h-[38dvh] overflow-y-auto sm:max-h-[45dvh]"}`}>
          <div className="flex items-center gap-3">
            <Avatar track={track} mood={reveal.correct ? "cheer" : reveal.skipped ? "think" : "oops"} size={compact ? 48 : 64} animate />
            <div className="grid gap-0.5">
              <p className={`flex items-center gap-2 text-xl font-bold ${reveal.correct ? "text-good" : "text-bad"}`}>
                {reveal.correct ? <CircleCheck className="size-6" aria-hidden /> : <CircleX className="size-6" aria-hidden />}
                {verdict}
              </p>
              {line && line !== verdict && <p className="font-medium text-ink-2">{line}</p>}
            </div>
          </div>
          {!reveal.correct && !written && (
            <div className="text-[0.9375rem]">
              <p className="font-semibold">Bonne réponse :</p>
              <p className="whitespace-pre-line">{renderInline(correctAnswerText(q))}</p>
            </div>
          )}
          {feedback && <p className="text-[0.9375rem] font-medium">{renderInline(feedback)}</p>}
          <p className="text-[0.9375rem] text-ink-2">{renderInline(q.explanation)}</p>
        </div>
      ) : (
        !compact && <p className="hidden text-sm text-muted sm:block">{keyHint(q)}</p>
      )}
      {reveal ? (
        !compact && (
          <button className={`btn btn-lg flex-none sm:min-w-44 ${blockBtn} ${reveal.correct ? "bg-good text-white" : "bg-bad text-white"}`} onClick={next}>
            Continuer
          </button>
        )
      ) : (
        <div className={`flex flex-none flex-wrap items-center gap-2 ${compact ? "" : "sm:flex-row-reverse"}`}>
          <button className={`btn btn-primary btn-lg flex-none sm:min-w-44 ${blockBtn}`} onClick={check} disabled={!isDraftComplete(q, draft)}>
            Vérifier
          </button>
          {(written || compact) && (
            <button className="btn btn-ghost" onClick={skip}>
              {compact ? "Passer" : "Passer la question"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={compact ? "grid gap-6" : reveal ? "pb-[26rem] sm:pb-80" : "pb-48"}
      style={!compact && reveal && sheetHeight ? { paddingBottom: sheetHeight + 32 } : undefined}
    >
      <div key={`${q.id}-${index}`} className={`fade-in ${reveal && !reveal.correct ? "shake" : ""}`}>
        <QuestionView question={q} draft={draft} setDraft={setDraft} reveal={reveal} displayOrder={order} />
        {step.retry && <p className="mt-5 text-sm font-medium text-ink-2">Deuxième essai. {mascotLine(track, "retry", index)}</p>}
      </div>

      {compact ? (
        <div className={`rounded-2xl border p-4 ${tone}`} role={reveal ? "status" : undefined} aria-live="polite">
          {panel}
        </div>
      ) : (
        <div ref={sheet} className={`fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] ${tone}`} role={reveal ? "status" : undefined} aria-live="polite">
          {panel}
        </div>
      )}
    </div>
  );
}

/** One ungraded question inside a lesson: check, read the correction, continue. No retry loop. */
export function QuestionCheck({ question, track, onDone }: { question: Question; track: TrackId; onDone: () => void }) {
  return <QuizRunner questions={[question]} track={track} compact onDone={() => onDone()} />;
}
