import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, RotateCcw } from "lucide-react";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { LESSONS, THEMES, THEME_IDS, getLesson } from "@/content";
import { DAILY_LIMIT, getDueItems, getKnowledge, getReviewItems, getWeeklyPlan } from "@/lib/data";
import { themeMastery } from "@/lib/mastery";

export const metadata: Metadata = { title: "Révisions" };

export default async function ReviewPage() {
  const [due, weekly, items, { knowledge }] = await Promise.all([getDueItems(), getWeeklyPlan(), getReviewItems(), getKnowledge()]);
  const today = Math.min(due.length, DAILY_LIMIT);
  const mastery = themeMastery(LESSONS, knowledge.completed, items, THEME_IDS).filter((m) => m.lessonsDone > 0);

  return (
    <div className="grid max-w-5xl gap-10">
      <header className="grid gap-3">
        <h1 className="display display-l">Révisions</h1>
        <p className="lede !max-w-[60ch]">Une notion réussie revient de plus en plus tard : 1 jour, 2, 4, 7, 15, puis 30. Une erreur la fait revenir dès le lendemain. À partir de la deuxième révision, elle revient parfois sous une autre question.</p>
      </header>
      <div className="grid items-start gap-5 md:grid-cols-2">
        <section className="tile flex flex-col gap-6 p-6 sm:p-8">
          <RotateCcw className="size-8" aria-hidden />
          <div className="grid gap-2">
            <h2 className="display display-s">Révision du jour</h2>
            <p className="text-ink-2">
              {today
                ? `${today} notion${today > 1 ? "s" : ""} à revoir${due.length > today ? ` (sur ${due.length} en attente : les plus anciennes d'abord)` : ""}.`
                : "Tout est à jour. Les notions des cours terminés reviendront ici au bon moment."}
            </p>
          </div>
          {today ? <Link href="/review/daily" className="btn btn-primary btn-lg mt-auto w-fit">Réviser maintenant</Link> : <Link href="/learn" className="btn btn-secondary btn-lg mt-auto w-fit">Faire un cours</Link>}
        </section>
        <section className="tile-accent tile flex flex-col gap-6 p-6 sm:p-8">
          <CalendarDays className="size-8" aria-hidden />
          <div className="grid gap-2">
            <h2 className="display display-s">Révision de la semaine</h2>
            {weekly.items.length ? (
              <>
                <p>{weekly.items.length} questions sur les cours terminés ces 7 derniers jours, en commençant par tes points faibles.</p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {weekly.lessonIds.map((id) => <li key={id} className="rounded-full bg-surface px-3 py-1 text-sm font-medium">{getLesson(id)?.title}</li>)}
                </ul>
                <p className="text-sm font-semibold">{weekly.bonusClaimed ? "Bonus de la semaine déjà obtenu. Tu peux la refaire pour t'entraîner." : "+30 XP de bonus la première fois cette semaine."}</p>
              </>
            ) : (
              <p>Elle apparaît dès que tu as terminé un cours dans les 7 derniers jours.</p>
            )}
          </div>
          {weekly.items.length ? <Link href="/review/weekly" className="btn btn-primary btn-lg mt-auto w-fit">Lancer la révision</Link> : <Link href="/learn" className="btn btn-primary btn-lg mt-auto w-fit">Faire un cours</Link>}
        </section>
      </div>

      {mastery.length > 0 && (
        <section className="grid gap-4" aria-labelledby="mastery">
          <h2 id="mastery" className="display display-s">Maîtrise par thème</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {mastery.map((m) => {
              const total = m.mastered + m.learning + m.fragile;
              return (
                <li key={m.theme} data-theme={m.theme} className="tile grid gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <span className="tile-th grid size-9 place-items-center rounded-xl"><ThemeGlyph theme={m.theme} size={20} /></span>
                    <span className="font-semibold">{THEMES[m.theme].name}</span>
                    <span className="meta ml-auto tabular">{m.lessonsDone}/{m.lessonsTotal} cours</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-sunk" role="img" aria-label={`${m.mastered} notions maîtrisées, ${m.learning} en cours, ${m.fragile} fragiles`}>
                    {total > 0 && (
                      <>
                        <span className="bg-ink" style={{ width: `${(m.mastered / total) * 100}%` }} />
                        <span className="bg-th" style={{ width: `${(m.learning / total) * 100}%` }} />
                        <span className="bg-bad/70" style={{ width: `${(m.fragile / total) * 100}%` }} />
                      </>
                    )}
                  </div>
                  <p className="tabular text-sm text-ink-2">{m.mastered} maîtrisées · {m.learning} en cours · {m.fragile} fragiles</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
