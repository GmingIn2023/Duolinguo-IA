import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { chooseTrack } from "@/app/actions";
import { TRACKS, TRACK_IDS, getLesson } from "@/content";
import { getProgress, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Choisir un parcours" };

export default async function TracksPage() {
  const { profile } = await requireViewer();
  const progress = await getProgress();
  return (
    <div className="grid max-w-5xl gap-10">
      <header className="grid gap-3">
        <h1 className="display display-l">{profile.track_id ? "Changer de parcours" : "Choisis ton parcours"}</h1>
        <p className="lede !max-w-[56ch]">Tes cours terminés restent acquis : les cours communs à plusieurs parcours sont déjà cochés quand tu changes.</p>
      </header>
      <form action={chooseTrack} className="grid gap-5 lg:grid-cols-3">
        {TRACK_IDS.map((id) => {
          const t = TRACKS[id];
          const current = profile.track_id === id;
          const done = t.lessonIds.filter((l) => progress.has(l)).length;
          return (
            <button key={id} name="track" value={id} data-track={id} className={`tile tile-press flex flex-col gap-6 p-6 text-left ${current ? "tile-accent" : ""}`} aria-current={current ? "true" : undefined}>
              <span className="grid size-20 place-items-center rounded-3xl bg-surface shadow-[0_4px_0_var(--accent-deep)]"><Avatar track={id} size={64} /></span>
              <span className="grid gap-1">
                <span className="text-sm font-semibold">{t.animal} · {t.audience}{current && " · Ton parcours"}</span>
                <span className="display display-s">{t.name}</span>
                <span className="text-[0.9375rem]">{t.pitch}</span>
              </span>
              <span className="mt-auto grid gap-2">
                <span className="tabular text-sm font-medium">{done}/{t.lessonIds.length} cours terminés</span>
                <span className="text-sm text-ink-2">{t.lessonIds.slice(0, 3).map((l) => getLesson(l)?.title).join(" · ")}…</span>
              </span>
              <span className={`btn w-full ${current ? "btn-secondary" : "btn-primary"}`}>{current ? "Continuer ce parcours" : "Choisir ce parcours"}</span>
            </button>
          );
        })}
      </form>
    </div>
  );
}
