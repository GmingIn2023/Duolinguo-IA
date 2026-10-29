"use client";

import { useState } from "react";
import type { Answer, Block, Question, ThemeId, TrackId } from "@/content/types";
import { BlockView } from "@/components/lesson/BlockView";
import { QuestionView, type Draft } from "@/components/quiz/QuestionView";
import { QuestionCheck, initialOrder } from "@/components/quiz/QuizRunner";
import { gradeAnswer } from "@/lib/grading";

export type GalleryBlock = { block: Block; lessonId: string; theme: ThemeId };
export type GalleryQuestion = { question: Question; lessonId: string; theme: ThemeId };

/** A right and a wrong answer for each question type, to show the corrected states. */
function answersFor(q: Question): { right: Answer; wrong: Answer } {
  switch (q.type) {
    case "mcq":
    case "fill_choice":
      return { right: q.answer, wrong: q.options.find((o) => o.id !== q.answer)!.id };
    case "true_false":
      return { right: q.answer, wrong: !q.answer };
    case "ordering":
    case "ranking":
      return { right: q.answer, wrong: [...q.answer].reverse() };
    case "match":
      return { right: q.answer, wrong: [...q.answer.slice(1), q.answer[0]] };
    case "sort":
      return { right: q.answer.map(String), wrong: q.answer.map((b) => String(1 - b)) };
    case "ai_analysis":
    case "multi": {
      const extra = q.options.find((o) => !q.answer.includes(o.id));
      return { right: q.answer, wrong: extra ? [q.answer[0], extra.id] : q.answer.slice(1) };
    }
    case "written":
      return { right: q.modelAnswer, wrong: "Je ne sais pas trop." };
  }
}

function Frozen({ question, answer, theme }: { question: Question; answer: Answer; theme: ThemeId }) {
  const [draft, setDraft] = useState<Draft>(answer);
  const correct = gradeAnswer(question, answer);
  return (
    <div data-theme={theme} className="grid grid-cols-1 gap-3">
      <p className={`meta font-semibold ${correct ? "text-good" : "text-bad"}`}>Corrigé · {correct ? "réponse juste" : "réponse fausse"}</p>
      <QuestionView question={question} draft={draft} setDraft={setDraft} reveal={{ correct }} displayOrder={initialOrder(question)} />
    </div>
  );
}

export function Gallery({ blocks, questions, track, only }: { blocks: GalleryBlock[]; questions: GalleryQuestion[]; track: TrackId; only?: string }) {
  const [, setDone] = useState(0);
  return (
    <div data-track={track} className="mx-auto grid max-w-3xl gap-16 px-4 py-10 grid-cols-1">
      <header className="grid gap-2">
        <h1 className="display display-l">Galerie des blocs et questions</h1>
        <p className="meta">
          {blocks.length} blocs · {questions.length} types de questions · ?view=gallery&amp;only=blocks|questions|&lt;type&gt;
        </p>
      </header>

      {(!only || only === "blocks" || blocks.some((b) => b.block.type === only)) && (
        <section className="grid grid-cols-1 gap-12" aria-label="Blocs">
          {blocks
            .filter((b) => !only || only === "blocks" || b.block.type === only)
            .map(({ block, lessonId, theme }) => (
              <article key={block.type} id={`block-${block.type}`} data-theme={theme} className="grid grid-cols-1 gap-3">
                <p className="meta border-b border-line pb-2">
                  Bloc {block.type} · {lessonId}
                </p>
                <BlockView block={block} track={track} onCheckDone={() => setDone((n) => n + 1)} />
              </article>
            ))}
        </section>
      )}

      {(!only || only === "questions" || questions.some((q) => q.question.type === only)) && (
        <section className="grid grid-cols-1 gap-16" aria-label="Questions">
          {questions
            .filter((q) => !only || only === "questions" || q.question.type === only)
            .map(({ question, lessonId, theme }) => {
              const { right, wrong } = answersFor(question);
              return (
                <article key={question.type} id={`question-${question.type}`} data-theme={theme} className="grid grid-cols-1 gap-8">
                  <p className="meta border-b border-line pb-2">
                    Question {question.type} · {lessonId}
                  </p>
                  <QuestionCheck question={question} track={track} onDone={() => setDone((n) => n + 1)} />
                  <Frozen question={question} answer={right} theme={theme} />
                  <Frozen question={question} answer={wrong} theme={theme} />
                </article>
              );
            })}
        </section>
      )}
    </div>
  );
}
