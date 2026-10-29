import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, RotateCcw } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { LESSONS, THEMES, THEME_IDS } from "@/content";
import { DAILY_LIMIT, getDueItems, getKnowledge, getReviewItems, getWeeklyPlan, requireViewer } from "@/lib/data";
import { themeMastery } from "@/lib/mastery";

export const metadata: Metadata = { title: "Révisions" };

export default async function ReviewPage() {
  const [{ profile }, due, weekly, items, { knowledge }] = await Promise.all([requireViewer(), getDueItems(), getWeeklyPlan(), getReviewItems(), getKnowledge()]);
  const track = profile.track_id ?? "bird";
  const today = Math.min(due.length, DAILY_LIMIT);
  const mastery = themeMastery(LESSONS, knowledge.completed, items, THEME_IDS).filter((m) => m.lessonsDone > 0);

  return (
    <div className="mx-auto grid max-w-3xl gap-8" data-track={track}>
      <header className="flex items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="display display-l">Révisions</h1>
          <p className="lede">Ce que tu rates revient <strong className="text-ink">vite</strong>. Ce que tu réussis revient <strong className="text-ink">de plus en plus tard</strong>.</p>
        </div>
        <Avatar track={track} size={96} mood={today ? "think" : "sleep"} animate decorative className="flex-none max-sm:hidden" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="tile-accent tile flex flex-col gap-4 p-6">
          <RotateCcw className="size-7" aria-hidden />
          <div className="grid gap-1">
            <h2 className="display display-s">Révision du jour</h2>
            <p>{today ? `${today} notion${today > 1 ? "s" : ""}, environ ${Math.max(2, Math.round(today * 0.5))} min.` : "Rien à revoir aujourd'hui."}</p>
          </div>
          {today ? (
            <Link href="/review/daily" className="btn btn-primary mt-auto w-fit">Réviser</Link>
          ) : (
            <Link href="/learn" className="btn mt-auto w-fit bg-surface text-ink shadow-[0_3px_0_var(--accent-deep)]">Faire un cours</Link>
          )}
        </section>
        <section className="tile flex flex-col gap-4 p-6">
          <CalendarDays className="size-7" aria-hidden />
          <div className="grid gap-1">
            <h2 className="display display-s">Révision de la semaine</h2>
            <p className="text-ink-2">
              {weekly.items.length
                ? `${weekly.items.length} questions sur tes cours des 7 derniers jours.${weekly.bonusClaimed ? "" : " +30 XP de bonus."}`
                : "Elle s'ouvre après ton premier cours de la semaine."}
            </p>
          </div>
          {weekly.items.length > 0 && <Link href="/review/weekly" className="btn btn-secondary mt-auto w-fit">Lancer</Link>}
        </section>
      </div>

      {mastery.length > 0 && (
        <section className="grid gap-3" aria-labelledby="mastery">
          <h2 id="mastery" className="font-semibold text-muted">Par thème</h2>
          <ul className="grid gap-3">
            {mastery.map((m) => {
              const total = m.mastered + m.learning + m.fragile;
              return (
                <li key={m.theme} data-theme={m.theme} className="tile flex items-center gap-4 p-4">
                  <span className="tile-th grid size-10 flex-none place-items-center rounded-full"><ThemeGlyph theme={m.theme} size={20} /></span>
                  <div className="grid flex-1 gap-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{THEMES[m.theme].name}</span>
                      <span className="meta tabular">{m.mastered}/{total} acquises</span>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-sunk" role="img" aria-label={`${m.mastered} notions acquises, ${m.learning} en cours, ${m.fragile} fragiles`}>
                      {total > 0 && (
                        <>
                          <span className="bg-good" style={{ width: `${(m.mastered / total) * 100}%` }} />
                          <span className="bg-th" style={{ width: `${(m.learning / total) * 100}%` }} />
                          <span className="bg-bad/70" style={{ width: `${(m.fragile / total) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-good" />acquises</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-sunk shadow-[inset_0_0_0_2px_var(--muted)]" />en cours</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-bad/70" />fragiles</span>
          </p>
        </section>
      )}
    </div>
  );
}
