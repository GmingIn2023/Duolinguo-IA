import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Check, Clock, Lock, RotateCcw, Zap } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Stat } from "@/components/AppShell";
import { LEVEL_LABEL } from "@/lib/labels";
import { TRACKS, trackLessons } from "@/content";
import { getDueQuestionIds, getProgress, getWeeklyPlan, requireViewer } from "@/lib/data";
import { lessonStatuses } from "@/lib/unlock";

export const metadata: Metadata = { title: "Mon parcours" };

export default async function LearnPage() {
  const { profile } = await requireViewer();
  if (!profile.track_id) redirect("/tracks");
  const track = TRACKS[profile.track_id];
  const [progress, due, weekly] = await Promise.all([getProgress(), getDueQuestionIds(99), getWeeklyPlan()]);
  const statuses = lessonStatuses(trackLessons(track.id), new Set(progress.keys()), profile.placement_level);
  const doneCount = statuses.filter((s) => s.status === "completed").length;
  const finished = doneCount === statuses.length;

  return (
    <div className="grid max-w-6xl gap-10 xl:grid-cols-[1fr_20rem] xl:gap-14">
      <div className="min-w-0">
        <header className="mb-10 flex items-center gap-5">
          <span className="grid size-20 flex-none place-items-center rounded-3xl bg-accent shadow-[0_5px_0_var(--accent-deep)] sm:size-24">
            <Avatar track={track.id} size={64} />
          </span>
          <div className="min-w-0">
            <h1 className="display display-m">{track.name}</h1>
            <p className="tabular mt-1 text-ink-2">{track.animal} · {track.audience} · {doneCount} cours terminés sur {statuses.length}</p>
          </div>
        </header>

        <div className="mb-10 flex gap-1.5" aria-hidden>
          {statuses.map((s) => (
            <span key={s.lesson.id} className={`h-2.5 flex-1 rounded-full ${s.status === "completed" ? "bg-accent shadow-[inset_0_-2px_0_var(--accent-deep)]" : "bg-sunk"}`} />
          ))}
        </div>

        {finished && (
          <section className="tile-ink tile mb-10 grid gap-4 p-6 sm:p-8">
            <h2 className="display display-m">Parcours terminé.</h2>
            <p className="max-w-[50ch] text-paper/80">Tes révisions continuent de t&apos;envoyer les bonnes questions au bon moment. Envie d&apos;aller plus loin ? Un autre parcours réutilise ce que tu as déjà appris.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/review" className="btn bg-paper text-ink">Réviser</Link>
              <Link href="/tracks" className="btn text-paper shadow-[inset_0_0_0_1.5px_var(--paper)]">Choisir un autre parcours</Link>
            </div>
          </section>
        )}

        <ol className="grid gap-5" aria-label="Carte du parcours">
          {statuses.map(({ lesson, status }, i) => {
            const best = progress.get(lesson.id)?.best_score;
            const body = (
              <>
                <span
                  className={`display relative z-10 grid size-14 flex-none place-items-center rounded-2xl text-2xl sm:size-[4.5rem] sm:text-3xl ${
                    status === "completed" ? "bg-ink text-paper" : status === "locked" ? "bg-paper text-muted" : "bg-accent shadow-[inset_0_-4px_0_var(--accent-deep)]"
                  }`}
                >
                  {status === "completed" ? <Check className="size-7" strokeWidth={3} aria-hidden /> : status === "locked" ? <Lock className="size-6" aria-hidden /> : i + 1}
                </span>
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className={`font-semibold leading-tight ${status === "current" ? "display text-[clamp(1.375rem,2.4vw,1.875rem)]" : "text-lg"}`}>{lesson.title}</span>
                  {status === "current" && <span className="text-[0.9375rem] text-ink-2">{lesson.objective}</span>}
                  {status === "locked" && <span className="text-[0.9375rem] text-muted">Termine «&nbsp;{statuses[i - 1]?.lesson.title}&nbsp;» pour débloquer.</span>}
                  <span className="text-sm font-medium text-muted">
                    {LEVEL_LABEL[lesson.level]} · {lesson.durationMin}&nbsp;min · {lesson.xp}&nbsp;XP
                    {status === "completed" && best !== undefined && <> · {best}&nbsp;% du premier coup</>}
                  </span>
                </span>
                {status === "current" && <span className="btn btn-primary hidden flex-none sm:inline-flex">{doneCount ? "Continuer" : "Commencer"}</span>}
              </>
            );
            const cls = `flex items-center gap-4 p-4 sm:gap-5 sm:p-5 ${status === "locked" ? "tile tile-sunk" : "tile tile-press"} ${status === "current" ? "sm:p-7 outline-2 outline-ink" : ""}`;
            return (
              <li key={lesson.id} className={status === "current" ? "py-1" : undefined}>
                {status === "locked" ? (
                  <div className={cls} aria-disabled="true">{body}</div>
                ) : (
                  <Link href={`/lesson/${lesson.id}`} className={cls} aria-label={`${lesson.title}${status === "completed" ? ", terminé" : status === "current" ? ", cours suivant" : ""}`}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <aside className="grid content-start gap-4 xl:sticky xl:top-10">
        <h2 className="text-lg font-semibold">Aujourd&apos;hui</h2>
        <div className="tile flex items-center justify-around p-5 text-xl">
          <Stat icon="streak" value={profile.streak_days} label="jours de série" />
          <span className="h-8 w-px bg-line" aria-hidden />
          <Stat icon="xp" value={profile.xp} label="points d'expérience" />
        </div>
        <Link href="/review/daily" className={`tile grid gap-2 p-5 ${due.length ? "tile-press tile-accent" : "pointer-events-none"}`} aria-disabled={!due.length}>
          <span className="flex items-center gap-2 font-semibold"><RotateCcw className="size-5" aria-hidden />Révision du jour</span>
          <span className="text-[0.9375rem]">
            {due.length ? `${due.length} question${due.length > 1 ? "s" : ""} à revoir maintenant.` : "Rien à revoir pour l'instant. Termine un cours : ses questions reviendront demain."}
          </span>
        </Link>
        <Link href="/review" className="tile tile-press grid gap-2 p-5">
          <span className="flex items-center gap-2 font-semibold"><CalendarDays className="size-5" aria-hidden />Révision de la semaine</span>
          <span className="text-[0.9375rem] text-ink-2">
            {weekly.questionIds.length
              ? `≈ 10 min sur ${weekly.lessonIds.length} cours de cette semaine.${weekly.bonusClaimed ? " Bonus déjà obtenu." : " +30 XP de bonus."}`
              : "Disponible dès ton premier cours terminé cette semaine."}
          </span>
        </Link>
        <p className="flex items-center gap-2 text-sm text-muted"><Clock className="size-4" aria-hidden />Les révisions s&apos;espacent quand tu réponds juste.</p>
        <p className="flex items-center gap-2 text-sm text-muted"><Zap className="size-4" aria-hidden />Refaire un cours terminé rapporte un petit bonus.</p>
      </aside>
    </div>
  );
}
