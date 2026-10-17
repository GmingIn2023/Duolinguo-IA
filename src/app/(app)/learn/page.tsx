import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Map as MapIcon, RotateCcw } from "lucide-react";
import { chooseTrack } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Stat } from "@/components/AppShell";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { LESSONS, THEMES, TRACKS, TRACK_IDS, getLesson } from "@/content";
import { boardView, itemHref, type BoardItem } from "@/lib/boardView";
import { getDueItems, getKnowledge, getResume, getReviewItems, getWeeklyPlan, requireViewer } from "@/lib/data";
import { formatMinutes } from "@/lib/labels";
import { mascotLine } from "@/lib/mascot";
import { weakLessons } from "@/lib/mastery";
import { levelName } from "@/lib/placement";

export const metadata: Metadata = { title: "Accueil" };

export default async function LearnPage() {
  const { profile } = await requireViewer();
  if (!profile.track_id) return <PickTrack name={profile.display_name} />;

  const trackId = profile.track_id;
  const track = TRACKS[trackId];
  const [{ knowledge, prefs, level10 }, resume, due, weekly, items] = await Promise.all([getKnowledge(), getResume(), getDueItems(), getWeeklyPlan(), getReviewItems()]);
  const { items: board, summary } = boardView(track, knowledge, prefs.themes, resume);

  // a lesson left half-way wins over everything; then the recommended step of the board
  const resumeId = [...resume.keys()].find((id) => getLesson(id) && !knowledge.completed.has(id));
  const resumeLesson = resumeId ? getLesson(resumeId) : undefined;
  const recommended = board.find((b) => b.status === "recommended");

  // short sessions: open lessons that fit the learner's usual session length
  const open = board.filter((b) => b.lessonId && (b.status === "available" || b.status === "recommended") && b.id !== recommended?.id && b.lessonId !== resumeId);
  const fits = open.filter((b) => (b.durationMin ?? 99) <= prefs.sessionMinutes + 2).slice(0, 3);
  const others = open.filter((b) => !fits.includes(b)).slice(0, Math.max(0, 3 - fits.length));
  const weak = weakLessons(items, 2).map((w) => getLesson(w.lessonId)).filter((l) => l !== undefined);
  const hello = profile.display_name ? `Salut ${profile.display_name}.` : "Salut.";

  return (
    <div className="grid max-w-6xl gap-10 xl:grid-cols-[1fr_20rem] xl:gap-14">
      <div className="grid min-w-0 content-start gap-10">
        <header className="flex items-center gap-5">
          <span className="grid size-20 flex-none place-items-center rounded-3xl bg-accent shadow-[0_5px_0_var(--accent-deep)]">
            <Avatar track={trackId} size={62} />
          </span>
          <div className="grid min-w-0 gap-2">
            <h1 className="display display-m">{hello}</h1>
            <p className="bubble w-fit">{mascotLine(trackId, "welcome", profile.xp)}</p>
          </div>
        </header>

        {resumeLesson ? (
          <NextCard
            label="Reprendre où tu t'es arrêté"
            title={resumeLesson.title}
            detail={`Partie ${(resume.get(resumeLesson.id) ?? 0) + 1} sur ${resumeLesson.sections.length}`}
            theme={resumeLesson.theme}
            href={`/lesson/${resumeLesson.id}`}
            cta="Reprendre"
          />
        ) : recommended ? (
          <NextCard
            label={recommended.kind === "checkpoint" ? "Bilan d'étape" : "Ta prochaine étape"}
            title={recommended.title}
            detail={recommended.objective ?? `${recommended.covers} cours à revoir`}
            theme={recommended.theme ?? "projets"}
            href={itemHref(recommended)}
            cta={recommended.kind === "checkpoint" ? "Passer le bilan" : recommended.status === "covered" ? "Le faire quand même" : "Commencer"}
            minutes={recommended.durationMin}
          />
        ) : (
          <section className="tile-ink tile grid gap-4 p-6 sm:p-8">
            <h2 className="display display-m">Carte {track.name} terminée.</h2>
            <p className="max-w-[50ch] text-paper/80">Les révisions continuent de te renvoyer les bonnes notions au bon moment. Une autre carte réutilise tout ce que tu as appris.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/review" className="btn bg-paper text-ink">Réviser</Link>
              <Link href="/map" className="btn text-paper shadow-[inset_0_0_0_1.5px_var(--paper)]">Voir les autres cartes</Link>
            </div>
          </section>
        )}

        {(fits.length > 0 || others.length > 0) && (
          <section className="grid gap-4" aria-labelledby="also">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="also" className="display display-s">{fits.length ? `Dans tes ${prefs.sessionMinutes} minutes` : "Aussi ouverts"}</h2>
              <Link href="/courses?status=todo" className="text-sm font-semibold underline">Tous les cours ouverts</Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3">
              {[...fits, ...others].map((b) => <li key={b.id}><MiniCard item={b} /></li>)}
            </ul>
          </section>
        )}

        <section className="grid gap-4" aria-labelledby="progress">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="progress" className="display display-s">Ta carte : {track.name}</h2>
            <Link href="/map" className="inline-flex items-center gap-1.5 text-sm font-semibold underline"><MapIcon className="size-4" aria-hidden />Ouvrir la carte</Link>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {board.filter((b) => b.lessonId).map((b) => (
              <span key={b.id} className={`h-2.5 flex-1 rounded-full ${b.status === "completed" ? "bg-accent shadow-[inset_0_-2px_0_var(--accent-deep)]" : b.status === "covered" ? "bg-accent-soft" : "bg-sunk"}`} />
            ))}
          </div>
          <p className="tabular text-ink-2">
            {summary.done} cours sur {summary.total} · niveau estimé {level10}/10, {levelName(level10).toLowerCase()}
            {summary.minutesLeft > 0 && ` · encore ${formatMinutes(summary.minutesLeft)} environ`}
          </p>
        </section>
      </div>

      <aside className="grid content-start gap-4 xl:sticky xl:top-10">
        <h2 className="text-lg font-semibold">Aujourd&apos;hui</h2>
        <div className="tile flex items-center justify-around p-5 text-xl">
          <Stat icon="streak" value={profile.streak_days} label="jours de série" />
          <span className="h-8 w-px bg-line" aria-hidden />
          <Stat icon="xp" value={profile.xp} label="points d'expérience" />
        </div>
        {due.length ? (
          <Link href="/review/daily" className="ticket tile-press grid gap-2 bg-accent p-5">
            <span className="flex items-center gap-2 font-semibold"><RotateCcw className="size-5" aria-hidden />Révision du jour</span>
            <span className="text-[0.9375rem]">{Math.min(due.length, 12)} notion{due.length > 1 ? "s" : ""} à revoir, environ {Math.max(2, Math.round(Math.min(due.length, 12) * 0.5))} min.</span>
          </Link>
        ) : (
          <div className="tile grid gap-2 p-5">
            <span className="flex items-center gap-2 font-semibold"><RotateCcw className="size-5" aria-hidden />Révision du jour</span>
            <span className="text-[0.9375rem] text-ink-2">Rien à revoir pour l&apos;instant. Les notions d&apos;un cours terminé reviennent dès demain.</span>
          </div>
        )}
        <Link href="/review" className="tile tile-press grid gap-2 p-5">
          <span className="flex items-center gap-2 font-semibold"><CalendarDays className="size-5" aria-hidden />Révision de la semaine</span>
          <span className="text-[0.9375rem] text-ink-2">
            {weekly.items.length ? `${weekly.items.length} questions sur ${weekly.lessonIds.length} cours de la semaine.${weekly.bonusClaimed ? " Bonus déjà obtenu." : " +30 XP de bonus."}` : "Disponible dès ton premier cours terminé cette semaine."}
          </span>
        </Link>
        {weak.length > 0 && (
          <div className="tile grid gap-3 p-5">
            <span className="font-semibold">À consolider</span>
            <ul className="grid gap-2">
              {weak.map((l) => (
                <li key={l.id} data-theme={l.theme} className="flex items-center gap-2 text-[0.9375rem]">
                  <span className="tile-th grid size-7 flex-none place-items-center rounded-lg"><ThemeGlyph theme={l.theme} size={15} /></span>
                  <Link href={`/lesson/${l.id}`} className="underline">{l.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="flex items-center gap-2 text-sm text-muted"><Clock className="size-4" aria-hidden />Séance habituelle : {prefs.sessionMinutes} min. <Link href="/profile" className="underline">Changer</Link></p>
      </aside>
    </div>
  );
}

function NextCard({ label, title, detail, theme, href, cta, minutes }: { label: string; title: string; detail: string; theme: string; href: string; cta: string; minutes?: number }) {
  return (
    <Link href={href} data-theme={theme} className="tile-th tile tile-press group grid gap-5 overflow-hidden p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <h2 className="display display-l">{title}</h2>
          <p className="text-sm font-semibold opacity-80">{label}{minutes ? ` · ${formatMinutes(minutes)}` : ""}</p>
        </div>
        <p className="max-w-[48ch] text-[1.0625rem] opacity-90">{detail}</p>
      </div>
      <span className={`btn btn-lg w-fit ${theme === "projets" ? "bg-paper text-ink" : "btn-primary"}`}>{cta}<ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
    </Link>
  );
}

function MiniCard({ item }: { item: BoardItem }) {
  return (
    <Link href={itemHref(item)} data-theme={item.theme} className="tile tile-press flex h-full flex-col gap-3 p-4">
      <span className="tile-th grid size-9 place-items-center rounded-xl">{item.theme && <ThemeGlyph theme={item.theme} size={20} />}</span>
      <span className="display display-xs">{item.title}</span>
      <span className="meta mt-auto flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden />{item.durationMin ? formatMinutes(item.durationMin) : ""}{item.status === "covered" ? " · validé par ton test" : ""}</span>
    </Link>
  );
}

function PickTrack({ name }: { name: string | null }) {
  return (
    <div className="grid max-w-3xl gap-8">
      <header className="grid gap-3">
        <h1 className="display display-l">{name ? `Bienvenue ${name}.` : "Bienvenue."} Par quelle carte commencer ?</h1>
        <p className="lede">Ta progression est commune aux trois cartes : tu pourras changer quand tu veux. <Link href="/onboarding" className="underline">Faire le test de niveau</Link> pour qu&apos;on te conseille.</p>
      </header>
      <form action={chooseTrack} className="grid gap-3">
        {TRACK_IDS.map((id) => {
          const t = TRACKS[id];
          const count = t.nodes.filter((n) => n.lessonId).length;
          return (
            <button key={id} name="track" value={id} data-track={id} className="tile tile-press flex items-center gap-5 p-5 text-left">
              <span className="grid size-16 flex-none place-items-center rounded-2xl bg-accent-soft"><Avatar track={id} size={52} /></span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="display display-s">{t.name}</span>
                <span className="text-[0.9375rem] text-ink-2">{t.pitch}</span>
                <span className="text-sm font-semibold">{t.animal} · {t.audience} · {count} cours</span>
              </span>
            </button>
          );
        })}
      </form>
      <p className="text-sm text-muted">{LESSONS.length} cours au total, sur {Object.keys(THEMES).length} thèmes.</p>
    </div>
  );
}
