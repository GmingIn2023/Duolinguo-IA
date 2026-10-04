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
      <aside className="sticky top-0 hidden h-dvh flex-col gap-10 border-r border-line px-5 py-7 lg:flex">
        <Wordmark href="/learn" small />
        <AppNav dueCount={dueCount} variant="rail" />
        <div className="mt-auto flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[0_3px_0_var(--edge)]">
          {profile.track_id && <Avatar track={profile.track_id} size={40} />}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile.display_name ?? "Toi"}</p>
            <div className="flex gap-3 text-sm">
              <Stat icon="xp" value={profile.xp} label="points d'expérience" />
              <Stat icon="streak" value={profile.streak_days} label="jours de série" />
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
        <Wordmark href="/learn" small />
        <div className="flex gap-4 text-sm">
          <Stat icon="streak" value={profile.streak_days} label="jours de série" />
          <Stat icon="xp" value={profile.xp} label="points d'expérience" />
        </div>
      </header>

      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:pb-16 lg:pt-10">{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <AppNav dueCount={dueCount} variant="bar" />
      </div>
    </div>
  );
}
