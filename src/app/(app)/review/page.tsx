import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, RotateCcw } from "lucide-react";
import { getLesson } from "@/content";
import { getDueQuestionIds, getWeeklyPlan } from "@/lib/data";

export const metadata: Metadata = { title: "Révisions" };

export default async function ReviewPage() {
  const [due, weekly] = await Promise.all([getDueQuestionIds(12), getWeeklyPlan()]);
  return (
    <div className="grid max-w-5xl gap-10">
      <header className="grid gap-3">
        <h1 className="display display-l">Révisions</h1>
        <p className="lede !max-w-[56ch]">Chaque question réussie revient de plus en plus tard : 1 jour, 2, 4, 7, 15, puis 30. Une erreur la fait revenir dès le lendemain.</p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="tile flex flex-col gap-6 p-6 sm:p-8">
          <RotateCcw className="size-8" aria-hidden />
          <div className="grid gap-2">
            <h2 className="display display-s">Révision du jour</h2>
            <p className="text-ink-2">
              {due.length ? `${due.length} question${due.length > 1 ? "s" : ""} arrivée${due.length > 1 ? "s" : ""} à échéance.` : "Tout est à jour. Les questions des cours terminés reviendront ici au bon moment."}
            </p>
          </div>
          {due.length ? (
            <Link href="/review/daily" className="btn btn-primary btn-lg mt-auto w-fit">Réviser maintenant</Link>
          ) : (
            <Link href="/learn" className="btn btn-secondary btn-lg mt-auto w-fit">Continuer le parcours</Link>
          )}
        </section>
        <section className="tile-accent tile flex flex-col gap-6 p-6 sm:p-8">
          <CalendarDays className="size-8" aria-hidden />
          <div className="grid gap-2">
            <h2 className="display display-s">Révision de la semaine</h2>
            {weekly.questionIds.length ? (
              <>
                <p>Environ 10 minutes, {weekly.questionIds.length} questions sur les cours terminés ces 7 derniers jours, en commençant par tes points faibles.</p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {weekly.lessonIds.map((id) => <li key={id} className="rounded-full bg-surface px-3 py-1 text-sm font-medium">{getLesson(id)?.title}</li>)}
                </ul>
                <p className="text-sm font-semibold">{weekly.bonusClaimed ? "Bonus de la semaine déjà obtenu. Tu peux la refaire pour t'entraîner." : "+30 XP de bonus la première fois cette semaine."}</p>
              </>
            ) : (
              <p>Elle apparaît dès que tu as terminé un cours dans les 7 derniers jours.</p>
            )}
          </div>
          {weekly.questionIds.length ? (
            <Link href="/review/weekly" className="btn btn-primary btn-lg mt-auto w-fit">Lancer la révision</Link>
          ) : (
            <Link href="/learn" className="btn btn-primary btn-lg mt-auto w-fit">Faire un cours</Link>
          )}
        </section>
      </div>
    </div>
  );
}
