"use client";

import { useState } from "react";
import type { Question, ThemeId, TrackId } from "@/content/types";
import { QuizRunner } from "@/components/quiz/QuizRunner";

export function QuizPreview({ questions, track, theme }: { questions: Question[]; track: TrackId; theme: ThemeId }) {
  const [round, setRound] = useState(0);
  return (
    <div data-track={track} data-theme={theme} className="mx-auto max-w-3xl px-4 py-8">
      <QuizRunner key={round} questions={questions} track={track} onDone={() => setRound((r) => r + 1)} />
    </div>
  );
}
