import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { signOut } from "@/app/actions";
import { TRACKS, getLesson } from "@/content";
import { getProgress, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const { profile, user } = await requireViewer();
  const progress = await getProgress();
  const done = [...progress.values()].sort((a, b) => b.last_completed_at.localeCompare(a.last_completed_at));
  const skills = [...new Set(done.flatMap((p) => getLesson(p.lesson_id)?.skills ?? []))];
  const track = profile.track_id ? TRACKS[profile.track_id] : null;

  return (
    <div className="grid max-w-5xl gap-10">
      <header className="flex flex-wrap items-center gap-5">
        {track && <span className="grid size-20 place-items-center rounded-3xl bg-accent shadow-[0_5px_0_var(--accent-deep)]"><Avatar track={track.id} size={64} /></span>}
        <div>
          <h1 className="display display-m">{profile.display_name ?? "Ton profil"}</h1>
          <p className="text-ink-2">{user.email}{track && ` · ${track.animal}, ${track.name}`}</p>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-3 sm:gap-5">
        {[
          { k: "XP", v: profile.xp },
          { k: "Jours de série", v: profile.streak_days },
          { k: "Cours terminés", v: done.length },
        ].map((s) => (
          <div key={s.k} className="tile p-4 sm:p-6">
            <dt className="text-sm text-muted">{s.k}</dt>
            <dd className="display tabular mt-1 text-[clamp(1.75rem,4vw,3rem)]">{s.v}</dd>
          </div>
        ))}
      </dl>

      <section className="grid gap-4">
        <h2 className="display display-s">Compétences</h2>
        {skills.length ? (
          <ul className="flex flex-wrap gap-2">{skills.map((s) => <li key={s} className="rounded-full bg-surface px-3.5 py-1.5 font-medium shadow-[0_3px_0_var(--edge)]">{s}</li>)}</ul>
        ) : (
          <p className="text-ink-2">Tes compétences apparaîtront ici après ton premier cours. <Link href="/learn" className="font-semibold text-ink underline">Commencer</Link></p>
        )}
      </section>

      {done.length > 0 && (
        <section className="grid gap-4">
          <h2 className="display display-s">Historique</h2>
          <ul className="tile divide-y divide-line">
            {done.map((p) => (
              <li key={p.lesson_id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <Link href={`/lesson/${p.lesson_id}`} className="font-semibold hover:underline">{getLesson(p.lesson_id)?.title ?? p.lesson_id}</Link>
                <span className="tabular text-sm text-ink-2">{p.best_score}&nbsp;% du premier coup · {p.attempts} essai{p.attempts > 1 ? "s" : ""} · {new Date(p.last_completed_at).toLocaleDateString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={signOut}>
        <button className="btn btn-secondary">Se déconnecter</button>
      </form>
    </div>
  );
}
