import { notFound } from "next/navigation";
import { Board } from "@/components/Board";
import { LessonPlayer } from "@/components/LessonPlayer";
import { LESSONS, TRACKS, getLesson, isTrackId } from "@/content";
import { boardView } from "@/lib/boardView";

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

  const done = Number(sp.done ?? 5);
  const track = TRACKS[trackId];
  const completed = new Set(track.nodes.filter((n) => n.lessonId).slice(0, done).map((n) => n.lessonId!));
  const { items } = boardView(track, { completed, level10: Number(sp.level ?? 0) }, [], new Map());
  return (
    <div data-track={trackId} className="min-h-dvh p-4 sm:p-10">
      <Board track={track} items={items} mascot={trackId} />
    </div>
  );
}
