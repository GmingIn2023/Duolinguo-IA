"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { X } from "lucide-react";
import { submitReview } from "@/app/actions";
import type { Answer, Question, TrackId } from "@/content/types";
import { Avatar } from "@/components/Avatar";
import { LearnerPrefs } from "@/components/LearnerPrefs";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { mascotLine } from "@/lib/mascot";
import { PASS_RATIO } from "@/lib/progressRules";
import type { ReviewMode, ReviewResult } from "@/lib/types";

const LABEL = (mode: ReviewMode) => (mode === "daily" ? "Jour" : mode === "weekly" ? "Semaine" : "Bilan");

export function ReviewSession({ mode, title, questions, track, prefs }: { mode: ReviewMode; title: string; questions: Question[]; track: TrackId; prefs: { sounds: boolean; motion: "full" | "calm"; textSize: "normal" | "large" } }) {
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer> | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const back = mode.startsWith("checkpoint:") ? "/learn" : "/review";

  const save = useCallback((a: Record<string, Answer>) => {
    setAnswers(a);
    setError(null);
    start(async () => {
      try {
        setResult(await submitReview(mode, a));
      } catch {
        setError("Vérifie ta connexion, puis réessaie. Si ça persiste, reconnecte-toi.");
      }
    });
  }, [mode]);

  const total = result ? result.xpEarned + result.bonus : 0;
  const needed = result ? Math.ceil(result.expected * PASS_RATIO) : 0;
  return (
    <LearnerPrefs.Provider value={{ sounds: prefs.sounds }}>
    <div data-track={track} data-motion={prefs.motion} data-text={prefs.textSize} className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
          <Link href={back} className="icon-btn" aria-label="Quitter"><X className="size-6" aria-hidden /></Link>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-label="Avancement" aria-valuenow={Math.round((answers ? 1 : progress) * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.max(answers ? 1 : progress, 0.02) * 100}%`, boxShadow: "inset 0 -3px 0 var(--accent-deep)" }} />
          </div>
          <span className="text-sm font-semibold">{LABEL(mode)}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-10">
        {!answers && (
          <div className="grid gap-6">
            <p className="meta">{title} · {questions.length} questions</p>
            <QuizRunner questions={questions} track={track} onDone={save} onProgress={setProgress} />
          </div>
        )}
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
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h1 className="display text-[clamp(4.5rem,16vw,10rem)] leading-[0.85]" aria-label={`${total} XP gagnés`}>
                <span className="reveal-line"><span>+{total}</span></span>
                <span className="reveal-line"><span>XP</span></span>
              </h1>
              <Avatar track={track} mood={result.passed ? "cheer" : "think"} size={120} animate />
            </div>
            <div className="fade-in grid gap-2 [animation-delay:500ms]">
              <p className="bubble w-fit">{mascotLine(track, result.correct === result.total ? "perfect" : "done", result.totalXp)}</p>
              <p className="pt-3 text-xl font-semibold">{result.correct} sur {result.total} du premier coup.</p>
              {!result.passed && (
                <p className="rounded-xl bg-bad-soft px-4 py-3 font-medium text-bad" role="status">
                  Pas encore validé : il fallait {needed} bonnes réponses sur {result.expected}. Refais-le quand tu veux, le bonus t&apos;attend.
                </p>
              )}
              <p className="text-ink-2">
                {result.bonus ? `Dont ${result.bonus} XP de bonus. ` : ""}
                Les ratées reviennent dès demain.
              </p>
            </div>
            <div className="fade-in flex flex-wrap gap-3 [animation-delay:600ms]">
              <Link href="/learn" className="btn btn-primary btn-lg">Retour au chemin</Link>
              <Link href="/review" className="btn btn-secondary btn-lg">Révisions</Link>
            </div>
          </div>
        )}
      </main>
    </div>
    </LearnerPrefs.Provider>
  );
}
