import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { LessonPlayer } from "@/components/LessonPlayer";
import { TRACKS, getLesson, lessonPlace, trackLessons } from "@/content";
import { canOpenLesson } from "@/lib/path";
import { getKnowledge, getNotes, getResume, requireViewer } from "@/lib/data";

export async function generateMetadata(props: PageProps<"/lesson/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: getLesson(id)?.title ?? "Cours" };
}

export default async function LessonPage(props: PageProps<"/lesson/[id]">) {
  const { id } = await props.params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const [{ profile }, { knowledge }] = await Promise.all([requireViewer(), getKnowledge()]);
  const trackId = profile.track_id ?? "bird";

  const place = lessonPlace(lesson.id);
  const gate = canOpenLesson(lesson.id, trackId, place ? TRACKS[place.track] : undefined, knowledge, getLesson);
  if (!gate.ok) {
    const first = gate.first;
    return (
      <div data-track={trackId} data-theme={lesson.theme} className="mx-auto grid min-h-dvh max-w-2xl content-center gap-8 px-4 py-12">
        <span className="tile-th grid size-16 place-items-center rounded-2xl"><Lock className="size-7" aria-hidden /></span>
        <div className="grid gap-3">
          <h1 className="display display-l">{lesson.title}</h1>
          <p className="lede">Ce cours arrive plus loin sur ton chemin. Ta prochaine étape :</p>
        </div>
        {first?.lessonId && (
          <Link href={`/lesson/${first.lessonId}`} data-theme={first.theme} className="tile tile-press flex items-center justify-between gap-4 p-5">
            <span className="display display-xs">{first.title}</span>
            <span className="meta">{first.durationMin} min</span>
          </Link>
        )}
        <Link href="/learn" className="btn btn-secondary w-fit">Retour au chemin</Link>
      </div>
    );
  }

  const [resume, notes] = await Promise.all([getResume(), getNotes(lesson.id)]);
  // "next" follows the lesson's own track (a lesson opened from another track continues there)
  const path = trackLessons(place?.track ?? trackId);
  const here = path.findIndex((l) => l.id === id);
  const next = path.slice(here + 1).find((l) => !knowledge.completed.has(l.id)) ?? (here === -1 ? undefined : path[here + 1]);

  return (
    <LessonPlayer
      lesson={lesson}
      track={trackId}
      resumeAt={resume.get(lesson.id) ?? null}
      notes={notes}
      next={next && next.id !== id ? { id: next.id, title: next.title } : null}
      completedBefore={knowledge.completed.has(lesson.id)}
    />
  );
}
