import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/LessonPlayer";
import { PathView } from "@/components/path/PathView";
import { LESSONS, TRACKS, getLesson, isTrackId, trackLessons } from "@/content";
import { knowledgeFrom, trackPath } from "@/lib/path";
import type { Block, Question } from "@/content/types";
import { Gallery, type GalleryBlock, type GalleryQuestion } from "./Gallery";
import { QuizPreview } from "./QuizPreview";

/**
 * Development-only visual check of the signed-in screens with sample progress, so the UI can be
 * reviewed without a database. Returns 404 in production builds.
 */
export default async function Preview(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const sp = await props.searchParams;
  const trackId = isTrackId(sp.track) ? sp.track : "gecko";

  if (sp.view === "lesson") {
    const lesson = getLesson(sp.id ?? "") ?? LESSONS[0];
    return <LessonPlayer lesson={lesson} track={trackId} resumeAt={sp.resume ? Number(sp.resume) : null} notes={[]} next={null} completedBefore={false} />;
  }

  if (sp.view === "gallery") {
    const blocks = new Map<Block["type"], GalleryBlock>();
    const questions = new Map<Question["type"], GalleryQuestion>();
    for (const l of LESSONS) {
      for (const s of l.sections) for (const b of s.blocks) if (!blocks.has(b.type)) blocks.set(b.type, { block: b, lessonId: l.id, theme: l.theme });
      for (const q of [...l.questions, ...l.reviewQuestions]) if (!questions.has(q.type)) questions.set(q.type, { question: q, lessonId: l.id, theme: l.theme });
    }
    return <Gallery blocks={[...blocks.values()]} questions={[...questions.values()]} track={trackId} only={sp.only} />;
  }

  if (sp.view === "quiz") {
    // the full-screen runner (bottom sheet, keyboard shortcuts) on the questions of one type, or of one lesson
    const lesson = getLesson(sp.id ?? "");
    // &pool=all adds the lesson's review questions and in-lesson checks (used by the E2E content sweep)
    const all = lesson
      ? sp.pool === "all"
        ? [...lesson.questions, ...lesson.reviewQuestions, ...lesson.sections.flatMap((s) => s.blocks.flatMap((b) => (b.type === "check" ? [b.question] : [])))]
        : lesson.questions
      : LESSONS.flatMap((l) => [...l.questions, ...l.reviewQuestions]);
    const picked = sp.type ? all.filter((q) => q.type === sp.type).slice(0, 3) : sp.pool === "all" ? all : all.slice(0, 6);
    return <QuizPreview questions={picked.length ? picked : all.slice(0, 3)} track={trackId} theme={lesson?.theme ?? "prompt"} />;
  }

  // ?view=path&track=gecko&done=3&test=g1,g3
  const done = Number(sp.done ?? 3);
  const completed = trackLessons(trackId).slice(0, done).map((l) => l.id);
  const chapters = (sp.test ?? "").split(",").filter(Boolean);
  const path = trackPath(TRACKS[trackId], knowledgeFrom(completed, chapters.length ? { [trackId]: { score: 6, chapters, at: "" } } : {}), getLesson);
  return (
    <div data-track={trackId} className="mx-auto min-h-dvh max-w-xl p-4 sm:p-10">
      <PathView track={trackId} chapters={path.chapters} tested={chapters.length > 0} />
    </div>
  );
}
