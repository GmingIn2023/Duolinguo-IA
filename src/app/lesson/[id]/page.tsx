import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { LessonPlayer } from "@/components/LessonPlayer";
import { getLesson, trackLessons } from "@/content";
import { missingPrerequisites } from "@/lib/board";
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

  const missing = missingPrerequisites(lesson, knowledge, getLesson);
  if (missing.length) {
    return (
      <div data-track={trackId} data-theme={lesson.theme} className="mx-auto grid min-h-dvh max-w-2xl content-center gap-8 px-4 py-12">
        <span className="tile-th grid size-16 place-items-center rounded-2xl"><Lock className="size-7" aria-hidden /></span>
        <div className="grid gap-3">
          <h1 className="display display-l">{lesson.title}</h1>
          <p className="lede">Ce cours s&apos;appuie sur {missing.length > 1 ? "des notions vues" : "une notion vue"} avant. Commence par :</p>
        </div>
        <ul className="grid gap-3">
          {missing.map((m) => (
            <li key={m.id}>
              <Link href={`/lesson/${m.id}`} data-theme={m.theme} className="tile tile-press flex items-center justify-between gap-4 p-5">
                <span className="display display-xs">{m.title}</span>
                <span className="meta">{m.durationMin} min</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/map" className="btn btn-secondary w-fit">Retour à la carte</Link>
      </div>
    );
  }

  const [resume, notes] = await Promise.all([getResume(), getNotes(lesson.id)]);
  const path = trackLessons(trackId);
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
