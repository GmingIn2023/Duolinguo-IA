import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReviewSession } from "@/components/ReviewSession";
import { getQuestion } from "@/content";
import type { Question } from "@/content/types";
import { getDueQuestionIds, getWeeklyPlan, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Révision" };

export default async function ReviewModePage(props: PageProps<"/review/[mode]">) {
  const { mode } = await props.params;
  if (mode !== "daily" && mode !== "weekly") notFound();
  const { profile } = await requireViewer();
  const ids = mode === "daily" ? await getDueQuestionIds(12) : (await getWeeklyPlan()).questionIds;
  const questions = ids.map((id) => getQuestion(id)?.question).filter((q): q is Question => Boolean(q));
  if (!questions.length) redirect("/review");
  return <ReviewSession mode={mode} questions={questions} track={profile.track_id} />;
}
