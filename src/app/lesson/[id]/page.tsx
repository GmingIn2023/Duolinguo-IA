import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LessonPlayer } from "@/components/LessonPlayer";
import { getLesson, trackLessons } from "@/content";
import { getProgress, requireViewer } from "@/lib/data";
import { lessonStatuses } from "@/lib/unlock";

export async function generateMetadata(props: PageProps<"/lesson/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: getLesson(id)?.title ?? "Cours" };
}

export default async function LessonPage(props: PageProps<"/lesson/[id]">) {
  const { id } = await props.params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const { profile } = await requireViewer();
  const trackId = profile.track_id ?? "bird";
  const path = trackLessons(trackId);
  const progress = await getProgress();
  const statuses = lessonStatuses(path, new Set(progress.keys()), profile.placement_level);
  const here = statuses.findIndex((s) => s.lesson.id === id);
  if (here !== -1 && statuses[here].status === "locked") redirect("/learn");

  const next = here !== -1 ? path[here + 1] : undefined;
  return (
    <LessonPlayer
      lesson={lesson}
      track={trackId}
      prerequisiteTitles={lesson.prerequisites.map((p) => getLesson(p)?.title).filter((t): t is string => Boolean(t))}
      nextLesson={next ? { id: next.id, title: next.title } : null}
    />
  );
}
