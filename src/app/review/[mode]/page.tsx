import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReviewSession } from "@/components/ReviewSession";
import { findCheckpoint, getLesson } from "@/content";
import type { Question } from "@/content/types";
import { isKnown } from "@/lib/board";
import { DAILY_LIMIT, checkpointQuestions, getDueItems, getKnowledge, getWeeklyPlan, requireViewer, serveItems } from "@/lib/data";
import type { ReviewMode } from "@/lib/types";

export const metadata: Metadata = { title: "Révision" };

export default async function ReviewModePage(props: PageProps<"/review/[mode]">) {
  const mode = decodeURIComponent((await props.params).mode) as ReviewMode;
  const { profile } = await requireViewer();
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
    const found = findCheckpoint(mode.slice("checkpoint:".length));
    if (!found) notFound();
    const covers = found.node.covers ?? [];
    const { knowledge } = await getKnowledge();
    const missing = covers.map(getLesson).filter((l) => l && !isKnown(l, knowledge));
    if (missing.length) {
      return (
        <div data-track={track} className="mx-auto grid min-h-dvh max-w-2xl content-center gap-6 px-4">
          <h1 className="display display-l">{found.node.title}</h1>
          <p className="lede">Ce bilan s&apos;ouvre quand tu as fait les cours de l&apos;étape. Il te reste :</p>
          <ul className="grid gap-2">{missing.map((l) => <li key={l!.id}><Link className="font-semibold underline" href={`/lesson/${l!.id}`}>{l!.title}</Link></li>)}</ul>
          <Link href="/map" className="btn btn-secondary w-fit">Retour à la carte</Link>
        </div>
      );
    }
    questions = checkpointQuestions(covers);
    title = found.node.title ?? "Bilan";
  } else notFound();

  if (!questions.length) redirect("/review");
  return <ReviewSession mode={mode} title={title} questions={questions} track={track} />;
}
