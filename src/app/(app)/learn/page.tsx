import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { chooseTrack } from "@/app/actions";
import { Stat } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { GoalRing } from "@/components/path/GoalRing";
import { PathView } from "@/components/path/PathView";
import { TrackSwitcher } from "@/components/path/TrackSwitcher";
import { TRACKS, TRACK_IDS, getLesson } from "@/content";
import type { TrackId } from "@/content/types";
import { DAILY_LIMIT, getDueItems, getKnowledge, getResume, getTodayXp, requireViewer } from "@/lib/data";
import { trackPath } from "@/lib/path";
import { NEXT_TRACK } from "@/lib/placementRules";

export const metadata: Metadata = { title: "Accueil" };

export default async function LearnPage() {
  const { profile } = await requireViewer();
  if (!profile.track_id) return <PickTrack name={profile.display_name} />;

  const trackId = profile.track_id;
  const [{ knowledge, prefs, placements }, resume, due, todayXp] = await Promise.all([getKnowledge(), getResume(), getDueItems(), getTodayXp()]);
  const path = trackPath(TRACKS[trackId], knowledge, getLesson, resume);
  const tracks = TRACK_IDS.map((id) => {
    const p = id === trackId ? path : trackPath(TRACKS[id], knowledge, getLesson);
    return { id, name: TRACKS[id].name, audience: TRACKS[id].audience, done: p.done, total: p.total };
  });
  const tested = Object.entries(placements).sort((a, b) => (b[1]?.at ?? "").localeCompare(a[1]?.at ?? ""))[0]?.[0] as TrackId | undefined;
  const midChapter = path.chapters.find((c) => c.status === "current" && c.done > 0);
  const next = NEXT_TRACK[trackId];
  const reviews = Math.min(due.length, DAILY_LIMIT);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[minmax(0,34rem)_17rem] xl:justify-center xl:gap-14" data-track={trackId}>
      <div className="grid min-w-0 content-start gap-3">
        <h1 className="sr-only">
          {profile.display_name ? `Bonjour ${profile.display_name}. ` : ""}Ton chemin {TRACKS[trackId].name}
        </h1>
        <header className="sticky top-0 z-30 -mx-4 flex h-[3.75rem] items-center justify-between gap-3 bg-paper/95 px-3 backdrop-blur sm:-mx-8 sm:px-6 lg:static lg:mx-0 lg:h-auto lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <TrackSwitcher current={trackId} tracks={tracks} chapterName={midChapter?.chapter.name ?? null} testedTrack={tested ?? null} />
          <div className="flex items-center gap-4 text-[1.0625rem] xl:hidden">
            <Stat icon="streak" value={profile.streak_days} label="jours de série" />
            <Stat icon="xp" value={profile.xp} label="points d'expérience" />
            <GoalRing value={todayXp} goal={prefs.dailyGoal} size={34} />
          </div>
        </header>

        {path.done === 0 && !placements[trackId] && (
          <Link href={`/onboarding?track=${trackId}`} className="tile tile-press flex items-center gap-3 p-3.5 text-[0.9375rem]">
            <span className="grid size-10 flex-none place-items-center rounded-xl bg-accent-soft"><Avatar track={trackId} size={32} mood="wow" decorative /></span>
            <span>Tu connais déjà un peu ? <strong className="underline">Passe le test</strong> pour sauter ce que tu sais.</span>
          </Link>
        )}

        <PathView track={trackId} chapters={path.chapters} tested={Boolean(placements[trackId])} />

        {path.finished ? (
          <section className="tile-ink tile grid gap-3 p-6">
            <h2 className="display display-m">Parcours {TRACKS[trackId].name} terminé.</h2>
            <p className="text-paper/80">Les révisions continuent de te renvoyer les bonnes notions au bon moment.</p>
            {next && <Link href={`/onboarding?track=${next}`} className="btn w-fit bg-paper text-ink">Passer le test {TRACKS[next].name}</Link>}
          </section>
        ) : (
          next && (
            <section className="tile-sunk tile mt-4 flex items-center gap-4 p-4" data-track={next} aria-label="Parcours suivant">
              <Avatar track={next} size={56} mood="sleep" decorative />
              <div className="grid gap-0.5">
                <p className="font-semibold text-ink">Ensuite : {TRACKS[next].name}</p>
                <p className="text-sm">
                  {TRACKS[next].audience}. <Link href={`/onboarding?track=${next}`} className="font-semibold text-ink underline">Faire son test</Link>
                </p>
              </div>
            </section>
          )
        )}
      </div>

      <aside className="hidden content-start gap-4 xl:sticky xl:top-10 xl:grid">
        <div className="tile flex items-center justify-around p-4 text-lg">
          <Stat icon="streak" value={profile.streak_days} label="jours de série" />
          <Stat icon="xp" value={profile.xp} label="points d'expérience" />
        </div>
        <div className="tile flex items-center gap-4 p-4">
          <GoalRing value={todayXp} goal={prefs.dailyGoal} size={52} />
          <div className="grid">
            <p className="font-semibold">Objectif du jour</p>
            <p className="tabular text-sm text-muted">{Math.min(todayXp, prefs.dailyGoal)} / {prefs.dailyGoal} XP</p>
          </div>
        </div>
        {reviews > 0 && (
          <Link href="/review/daily" className="tile tile-press flex items-center gap-3 p-4">
            <span className="grid size-10 flex-none place-items-center rounded-xl bg-accent shadow-[0_3px_0_var(--accent-deep)]"><RotateCcw className="size-5" aria-hidden /></span>
            <span className="grid">
              <span className="font-semibold">Révision du jour</span>
              <span className="text-sm text-muted">{reviews} notion{reviews > 1 ? "s" : ""} · {Math.max(2, Math.round(reviews * 0.5))} min</span>
            </span>
          </Link>
        )}
      </aside>
    </div>
  );
}

function PickTrack({ name }: { name: string | null }) {
  return (
    <div className="mx-auto grid max-w-2xl gap-8">
      <header className="grid gap-3">
        <h1 className="display display-l">{name ? `Bienvenue ${name}.` : "Bienvenue."} Par où commencer ?</h1>
        <p className="lede !max-w-[52ch]">Choisis un parcours, ou <Link href="/onboarding" className="font-semibold text-ink underline">fais le test</Link> pour qu&apos;on te conseille.</p>
      </header>
      <form action={chooseTrack} className="grid gap-3">
        {TRACK_IDS.map((id) => {
          const t = TRACKS[id];
          return (
            <button key={id} name="track" value={id} data-track={id} className="tile tile-press flex items-center gap-4 p-4 text-left">
              <span className="grid size-16 flex-none place-items-center rounded-2xl bg-accent"><Avatar track={id} size={52} decorative /></span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="display display-s">{t.name}</span>
                <span className="text-[0.9375rem] text-ink-2">{t.pitch}</span>
              </span>
            </button>
          );
        })}
      </form>
    </div>
  );
}
