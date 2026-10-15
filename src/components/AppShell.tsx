import Link from "next/link";
import { Flame, Zap } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { AppNav } from "@/components/AppNav";
import { Wordmark } from "@/components/Wordmark";
import type { Profile } from "@/lib/types";

export function Stat({ icon, value, label }: { icon: "xp" | "streak"; value: number; label: string }) {
  const Icon = icon === "xp" ? Zap : Flame;
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold" title={label}>
      <Icon className={`size-[1.125rem] ${icon === "xp" ? "fill-bird text-ink" : value > 0 ? "fill-fox text-ink" : "text-muted"}`} strokeWidth={1.8} aria-hidden />
      <span className="tabular">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function AppShell({ profile, dueCount, children }: { profile: Profile; dueCount: number; children: React.ReactNode }) {
  return (
    <div data-track={profile.track_id ?? undefined} className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#contenu" className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">Aller au contenu</a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-10 border-r border-line px-5 py-7 lg:flex">
        <Wordmark href="/learn" small />
        <AppNav dueCount={dueCount} variant="rail" />
        <Link href="/profile" className="mt-auto flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[0_3px_0_var(--edge)] transition-transform hover:-translate-y-0.5">
          {profile.track_id && <Avatar track={profile.track_id} size={40} />}
          <span className="grid min-w-0">
            <span className="truncate text-sm font-semibold">{profile.display_name ?? "Toi"}</span>
            <span className="flex gap-3 text-sm">
              <Stat icon="xp" value={profile.xp} label="points d'expérience" />
              <Stat icon="streak" value={profile.streak_days} label="jours de série" />
            </span>
          </span>
        </Link>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
        <Wordmark href="/learn" small />
        <div className="flex items-center gap-4 text-sm">
          <Stat icon="streak" value={profile.streak_days} label="jours de série" />
          <Stat icon="xp" value={profile.xp} label="points d'expérience" />
          <Link href="/profile" className="grid size-11 place-items-center rounded-full hover:bg-sunk" aria-label="Profil et réglages">
            {profile.track_id ? <Avatar track={profile.track_id} size={30} /> : <span className="size-7 rounded-full bg-sunk" />}
          </Link>
        </div>
      </header>

      <main id="contenu" className="min-w-0 px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:pb-16 lg:pt-10">{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <AppNav dueCount={dueCount} variant="bar" />
      </div>
    </div>
  );
}
