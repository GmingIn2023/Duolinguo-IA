import type { Metadata } from "next";
import Link from "next/link";
import { chooseTrack } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Board } from "@/components/Board";
import { TRACKS, TRACK_IDS, isTrackId } from "@/content";
import { boardView } from "@/lib/boardView";
import { getKnowledge, getResume, requireViewer } from "@/lib/data";
import { formatMinutes } from "@/lib/labels";

export const metadata: Metadata = { title: "Carte" };

export default async function MapPage(props: PageProps<"/map">) {
  const { track: asked } = await props.searchParams;
  const [{ profile }, { knowledge, prefs }, resume] = await Promise.all([requireViewer(), getKnowledge(), getResume()]);
  const mine = profile.track_id ?? "bird";
  const trackId = isTrackId(asked) ? asked : mine;
  const track = TRACKS[trackId];
  const { items, summary } = boardView(track, knowledge, prefs.themes, resume);
  const pct = summary.total ? Math.round((summary.done / summary.total) * 100) : 0;

  return (
    <div className="grid max-w-[78rem] gap-8" data-track={trackId}>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="grid size-16 flex-none place-items-center rounded-2xl bg-accent shadow-[0_4px_0_var(--accent-deep)]">
            <Avatar track={trackId} size={50} />
          </span>
          <div className="grid gap-1">
            <p className="meta">{track.animal} · {track.audience}</p>
            <h1 className="display display-l">{track.name}</h1>
          </div>
        </div>
        <nav aria-label="Parcours" className="flex flex-wrap gap-2">
          {TRACK_IDS.map((id) => (
            <Link key={id} href={id === mine ? "/map" : `/map?track=${id}`} aria-current={id === trackId ? "true" : undefined} className="chip">
              {TRACKS[id].name}
              {id === mine && <span className="sr-only"> (ton parcours)</span>}
            </Link>
          ))}
        </nav>
      </header>

      <section aria-label="Avancement" className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex min-w-60 flex-1 items-center gap-4">
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-label="Cours faits sur cette carte" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%`, boxShadow: "inset 0 -3px 0 var(--accent-deep)" }} />
          </div>
          <span className="tabular font-semibold">{summary.done}/{summary.total}</span>
        </div>
        <p className="text-ink-2">
          {summary.finished ? "Carte terminée. Bravo." : `Encore ${formatMinutes(summary.minutesLeft)} environ.`}
          {prefs.mode === "free" ? " Mode libre : toutes les branches ouvertes se valent." : ""}
        </p>
      </section>

      {trackId !== mine && (
        <form action={chooseTrack} className="tile-sunk tile flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <p className="text-ink-2">Tu regardes la carte <strong className="text-ink">{track.name}</strong>. Ta progression est commune à toutes les cartes.</p>
          <input type="hidden" name="track" value={trackId} />
          <button className="btn btn-secondary">En faire mon parcours</button>
        </form>
      )}

      <Board track={track} items={items} mascot={trackId} free={prefs.mode === "free"} />

      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2" aria-label="Légende">
        <li className="flex items-center gap-2"><span className="size-4 rounded-full bg-ink" /> Terminé</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded-full bg-accent-soft shadow-[inset_0_0_0_2px_var(--accent-deep)]" /> Validé par le test</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded-full bg-accent shadow-[inset_0_-3px_0_var(--accent-deep)]" /> Ouvert</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded-full bg-sunk shadow-[inset_0_0_0_2px_var(--line)]" /> Verrouillé</li>
        <li className="flex items-center gap-2"><span className="size-3.5 rotate-45 rounded-[3px] bg-ink-2" /> Bilan d&apos;étape</li>
      </ul>
    </div>
  );
}
