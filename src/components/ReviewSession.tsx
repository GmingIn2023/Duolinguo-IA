"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { X } from "lucide-react";
import { submitReview } from "@/app/actions";
import type { Answer, Question, TrackId } from "@/content/types";
import type { ReviewResult } from "@/lib/types";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export function ReviewSession({ mode, questions, track }: { mode: "daily" | "weekly"; questions: Question[]; track: TrackId | null }) {
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer> | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();

  const save = useCallback((a: Record<string, Answer>) => {
    setAnswers(a);
    setError(null);
    start(async () => {
      try {
        setResult(await submitReview(mode, a));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      }
    });
  }, [mode]);

  return (
    <div data-track={track ?? undefined} className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
          <Link href="/review" className="grid size-10 place-items-center rounded-full hover:bg-sunk" aria-label="Quitter la révision"><X className="size-6" /></Link>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-label="Avancement de la révision" aria-valuenow={Math.round((answers ? 1 : progress) * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.max((answers ? 1 : progress) * 100, 3)}%`, boxShadow: "inset 0 -3px 0 var(--accent-deep)" }} />
          </div>
          <span className="text-sm font-semibold">{mode === "weekly" ? "Semaine" : "Jour"}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-10">
        {!answers && <QuizRunner questions={questions} onDone={save} onProgress={setProgress} />}
        {answers && error && (
          <div className="grid max-w-xl gap-5 py-10">
            <h1 className="display display-m">Ta révision n&apos;a pas été enregistrée.</h1>
            <p className="lede">{error}</p>
            <button className="btn btn-primary w-fit" onClick={() => save(answers)}>Réessayer l&apos;enregistrement</button>
          </div>
        )}
        {answers && !error && (saving || !result) && (
          <div className="grid gap-4 py-16" aria-busy="true"><div className="skeleton h-28 w-64" /><p className="text-muted">Enregistrement…</p></div>
        )}
        {result && !error && (
          <div className="grid gap-10 py-6">
            <h1 className="display text-[clamp(4.5rem,16vw,11rem)] leading-[0.85]" aria-label={`${result.xpEarned + result.weeklyBonus} XP gagnés`}>
              <span className="reveal-line"><span>+{result.xpEarned + result.weeklyBonus}</span></span>
              <span className="reveal-line"><span>XP</span></span>
            </h1>
            <div className="fade-in grid gap-2 [animation-delay:500ms]">
              <p className="text-xl font-semibold">{result.correct} sur {result.total} du premier coup.</p>
              <p className="text-ink-2">
                {result.weeklyBonus ? `Dont ${result.weeklyBonus} XP de bonus pour ta révision de la semaine. ` : ""}
                Les questions réussies reviendront plus tard, les autres dès demain.
              </p>
            </div>
            <div className="fade-in flex flex-wrap gap-3 [animation-delay:600ms]">
              <Link href="/learn" className="btn btn-primary btn-lg">Retour au parcours</Link>
              <Link href="/review" className="btn btn-secondary btn-lg">Révisions</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
