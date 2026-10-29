import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReviewSession } from "@/components/ReviewSession";
import { findChapter, getLesson } from "@/content";
import type { Question } from "@/content/types";
import { lessonKnown } from "@/lib/path";
import { DAILY_LIMIT, checkpointQuestions, getDueItems, getKnowledge, getWeeklyPlan, requireViewer, serveItems } from "@/lib/data";
import type { ReviewMode } from "@/lib/types";

export const metadata: Metadata = { title: "Révision" };

export default async function ReviewModePage(props: PageProps<"/review/[mode]">) {
  const raw = (await props.params).mode;
  let mode: ReviewMode;
  try {
    mode = decodeURIComponent(raw) as ReviewMode;
  } catch {
    notFound(); // malformed escape in the URL
  }
  const { profile } = await requireViewer();
  const { prefs } = await getKnowledge();
  const track = profile.track_id ?? "bird";
  let questions: Question[];
  let title: string;

  if (mode === "daily") {
    questions = serveItems((await getDueItems()).slice(0, DAILY_LIMIT)).map((s) => s.question);
    title = "Révision du jour";
  } else if (mode === "weekly") {
    questions = serveItems((await getWeeklyPlan()).items).map((s) => s.question);
    title = "Révision de la semaine";
  } else if (mode.startsWith("checkpoint:")) {
    const found = findChapter(mode.slice("checkpoint:".length));
    if (!found || found.chapter.project) notFound();
    const { chapter } = found;
    const { knowledge } = await getKnowledge();
    const missing = chapter.lessons.filter((id) => !lessonKnown(id, chapter.id, knowledge)).map(getLesson);
    if (missing.length) {
      return (
        <div data-track={track} className="mx-auto grid min-h-dvh max-w-2xl content-center gap-6 px-4">
          <h1 className="display display-l">Bilan : {chapter.name}</h1>
          <p className="lede">Ce bilan s&apos;ouvre quand tu as fait les cours du chapitre. Il te reste :</p>
          <ul className="grid gap-2">{missing.map((l) => l && <li key={l.id}><Link className="font-semibold underline" href={`/lesson/${l.id}`}>{l.title}</Link></li>)}</ul>
          <Link href="/learn" className="btn btn-secondary w-fit">Retour au chemin</Link>
        </div>
      );
    }
    questions = checkpointQuestions(chapter.lessons);
    title = `Bilan : ${chapter.name}`;
  } else notFound();

  if (!questions.length) redirect("/review");
  return <ReviewSession mode={mode} title={title} questions={questions} track={track} prefs={prefs} />;
}
