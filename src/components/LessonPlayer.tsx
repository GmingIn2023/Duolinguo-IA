"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { Clock, Flame, Gauge, Target, X, Zap } from "lucide-react";
import { completeLesson } from "@/app/actions";
import type { Answer, Block, Lesson, TrackId } from "@/content/types";
import type { LessonResult } from "@/lib/types";
import { Illustration } from "@/components/Illustration";
import { ToolCards } from "@/components/ToolCards";
import { QuizRunner } from "@/components/quiz/QuizRunner";

type Phase = "intro" | "learn" | "quiz" | "done";

export const LEVEL_LABEL = { 1: "Découverte", 2: "Pratique", 3: "Approfondi" } as const;

export function LessonPlayer({
  lesson,
  track,
  prerequisiteTitles,
  nextLesson,
}: {
  lesson: Lesson;
  track: TrackId;
  prerequisiteTitles: string[];
  nextLesson: { id: string; title: string } | null;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [quizProgress, setQuizProgress] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer> | null>(null);
  const [result, setResult] = useState<LessonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const save = useCallback((a: Record<string, Answer>) => {
    setAnswers(a);
    setPhase("done");
    setError(null);
    startSaving(async () => {
      try {
        setResult(await completeLesson(lesson.id, a));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      }
    });
  }, [lesson.id]);

  const progress = phase === "intro" ? 0 : phase === "learn" ? 0.15 : phase === "quiz" ? 0.15 + quizProgress * 0.85 : 1;

  return (
    <div data-track={track} className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
          <Link href="/learn" className="grid size-10 place-items-center rounded-full hover:bg-sunk" aria-label="Quitter le cours">
            <X className="size-6" />
          </Link>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-label="Avancement du cours" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${Math.max(progress * 100, 3)}%`, boxShadow: "inset 0 -3px 0 var(--accent-deep)" }} />
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold"><Zap className="size-4 fill-bird" aria-hidden />{lesson.xp}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-10">
        {phase === "intro" && <Intro lesson={lesson} prerequisiteTitles={prerequisiteTitles} onStart={() => setPhase("learn")} />}
        {phase === "learn" && <Learn lesson={lesson} onQuiz={() => { setPhase("quiz"); window.scrollTo({ top: 0 }); }} />}
        {phase === "quiz" && <QuizRunner questions={lesson.questions} onDone={save} onProgress={setQuizProgress} />}
        {phase === "done" && (
          <Done
            lesson={lesson}
            saving={saving}
            error={error}
            result={result}
            nextLesson={nextLesson}
            onRetrySave={() => answers && save(answers)}
          />
        )}
      </main>
    </div>
  );
}

function Intro({ lesson, prerequisiteTitles, onStart }: { lesson: Lesson; prerequisiteTitles: string[]; onStart: () => void }) {
  return (
    <div className="fade-in grid gap-8">
      <div className="grid gap-5">
        <h1 className="display display-l">{lesson.title}</h1>
        <p className="lede !max-w-[52ch]">{lesson.objective}</p>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        <Fact icon={Gauge} label="Niveau" value={LEVEL_LABEL[lesson.level]} />
        <Fact icon={Clock} label="Durée" value={`${lesson.durationMin} min`} />
        <Fact icon={Zap} label="À gagner" value={`${lesson.xp} XP`} />
      </dl>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="tile p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Target className="size-5" aria-hidden />Compétences</h2>
          <ul className="grid gap-2">
            {lesson.skills.map((s) => <li key={s} className="rounded-lg bg-accent-soft px-3 py-2 text-[0.9375rem] font-medium">{s}</li>)}
          </ul>
        </section>
        <section className="tile p-5">
          <h2 className="mb-3 font-semibold">À connaître avant</h2>
          {prerequisiteTitles.length ? (
            <ul className="grid gap-2">{prerequisiteTitles.map((t) => <li key={t} className="rounded-lg bg-sunk px-3 py-2 text-[0.9375rem]">{t}</li>)}</ul>
          ) : (
            <p className="text-[0.9375rem] text-ink-2">Rien du tout. C&apos;est un point de départ.</p>
          )}
        </section>
      </div>
      <div>
        <button className="btn btn-primary btn-lg" onClick={onStart} autoFocus>Commencer le cours</button>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="tile p-4">
      <dt className="flex items-center gap-1.5 text-sm text-muted"><Icon className="size-4" aria-hidden />{label}</dt>
      <dd className="mt-1 text-lg font-semibold sm:text-xl">{value}</dd>
    </div>
  );
}

function Learn({ lesson, onQuiz }: { lesson: Lesson; onQuiz: () => void }) {
  return (
    <article className="fade-in grid gap-10">
      <h1 className="display display-m">{lesson.title}</h1>
      {lesson.blocks.map((b, i) => <BlockView key={i} block={b} />)}
      <div className="tile-accent tile flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-semibold">{lesson.questions.length} questions pour vérifier ce que tu as compris.</p>
        <button className="btn btn-primary btn-lg" onClick={onQuiz}>Passer au quiz</button>
      </div>
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return (
        <section className="grid gap-3">
          {block.title && <h2 className="display display-s">{block.title}</h2>}
          <p className="prose-gg">{block.body}</p>
        </section>
      );
    case "illustration":
      return <Illustration id={block.id} caption={block.caption} />;
    case "example":
      return (
        <div className={`rounded-2xl p-5 ${block.good === false ? "bg-bad-soft" : block.good ? "bg-good-soft" : "bg-sunk"}`}>
          <p className={`mb-2 text-sm font-semibold ${block.good === false ? "text-bad" : block.good ? "text-good" : "text-ink-2"}`}>{block.label}</p>
          <p className="text-[1.0625rem] font-medium leading-relaxed">{block.content}</p>
        </div>
      );
    case "keypoint":
      return (
        <p className="display text-[clamp(1.375rem,2.4vw,1.875rem)] leading-[1.15] tracking-[-0.02em]">
          {block.body}
        </p>
      );
    case "tools":
      return <ToolCards toolIds={block.toolIds} />;
  }
}

function Done({
  lesson,
  saving,
  error,
  result,
  nextLesson,
  onRetrySave,
}: {
  lesson: Lesson;
  saving: boolean;
  error: string | null;
  result: LessonResult | null;
  nextLesson: { id: string; title: string } | null;
  onRetrySave: () => void;
}) {
  if (error) {
    return (
      <div className="fade-in mx-auto grid max-w-xl gap-5 py-10">
        <h1 className="display display-m">Ta progression n&apos;a pas été enregistrée.</h1>
        <p className="lede">{error}</p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={onRetrySave}>Réessayer l&apos;enregistrement</button>
          <Link href="/login" className="btn btn-secondary">Se reconnecter</Link>
        </div>
      </div>
    );
  }
  if (saving || !result) {
    return (
      <div className="grid gap-4 py-16" aria-busy="true" aria-live="polite">
        <div className="skeleton h-28 w-64" />
        <p className="text-muted">Enregistrement de ta progression…</p>
      </div>
    );
  }
  return (
    <div className="grid gap-10 py-6">
      <div>
        <p className="mb-3 text-lg font-semibold">Cours terminé</p>
        <h1 className="display text-[clamp(4.5rem,16vw,11rem)] leading-[0.85]" aria-label={`${result.xpEarned} XP gagnés`}>
          <span className="reveal-line"><span>+{result.xpEarned}</span></span>
          <span className="reveal-line"><span>XP</span></span>
        </h1>
      </div>
      <dl className="fade-in grid grid-cols-3 gap-3 [animation-delay:500ms]">
        <div className="tile p-4">
          <dt className="text-sm text-muted">Du premier coup</dt>
          <dd className="tabular mt-1 text-xl font-semibold">{result.correct}/{result.total}</dd>
        </div>
        <div className="tile p-4">
          <dt className="flex items-center gap-1 text-sm text-muted"><Flame className="size-4" aria-hidden />Série</dt>
          <dd className="tabular mt-1 text-xl font-semibold">{result.streak} j</dd>
        </div>
        <div className="tile p-4">
          <dt className="flex items-center gap-1 text-sm text-muted"><Zap className="size-4" aria-hidden />Total</dt>
          <dd className="tabular mt-1 text-xl font-semibold">{result.totalXp}</dd>
        </div>
      </dl>
      <section className="fade-in grid gap-3 [animation-delay:600ms]">
        <h2 className="font-semibold">{result.firstCompletion ? "Compétences acquises" : "Compétences renforcées"}</h2>
        <ul className="flex flex-wrap gap-2">
          {lesson.skills.map((s) => <li key={s} className="rounded-full bg-accent px-3.5 py-1.5 text-[0.9375rem] font-medium">{s}</li>)}
        </ul>
        <p className="text-[0.9375rem] text-ink-2">Ces questions reviendront dans tes révisions, au bon moment pour que tu les retiennes.</p>
      </section>
      <div className="fade-in flex flex-wrap gap-3 [animation-delay:700ms]">
        {nextLesson ? (
          <Link href={`/lesson/${nextLesson.id}`} className="btn btn-primary btn-lg">Cours suivant : {nextLesson.title}</Link>
        ) : null}
        <Link href="/learn" className={`btn btn-lg ${nextLesson ? "btn-secondary" : "btn-primary"}`}>Retour au parcours</Link>
      </div>
    </div>
  );
}
