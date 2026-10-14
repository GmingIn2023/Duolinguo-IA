"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Map, NotebookPen, RotateCcw, User } from "lucide-react";

const ITEMS = [
  { href: "/learn", label: "Accueil", icon: Home, bar: true },
  { href: "/map", label: "Carte", icon: Map, bar: true },
  { href: "/courses", label: "Cours", icon: BookOpen, bar: true },
  { href: "/review", label: "Révisions", icon: RotateCcw, bar: true },
  { href: "/notes", label: "Carnet", icon: NotebookPen, bar: true },
  { href: "/profile", label: "Profil", icon: User, bar: false },
];

export function AppNav({ dueCount, variant }: { dueCount: number; variant: "rail" | "bar" }) {
  const path = usePathname();
  const items = variant === "bar" ? ITEMS.filter((i) => i.bar) : ITEMS;
  return (
    <nav aria-label="Navigation principale" className={variant === "rail" ? "grid gap-1" : "grid grid-cols-5"}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        const badge = href === "/review" && dueCount > 0 ? Math.min(dueCount, 99) : null;
        return variant === "rail" ? (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-12 items-center gap-3 rounded-xl px-3.5 font-medium transition-colors ${active ? "bg-surface shadow-[0_3px_0_var(--edge)]" : "text-ink-2 hover:bg-sunk"}`}
          >
            <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
            {label}
            {badge && <span className="tabular ml-auto grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-semibold text-ink">{badge}<span className="sr-only"> à revoir</span></span>}
          </Link>
        ) : (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[0.6875rem] font-medium ${active ? "text-ink" : "text-muted"}`}
          >
            <Icon className="size-[1.375rem]" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
            {label}
            {badge && <span className="tabular absolute left-1/2 top-1.5 ml-2 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-accent px-1 text-[0.6875rem] font-semibold text-ink">{badge}<span className="sr-only"> à revoir</span></span>}
          </Link>
        );
      })}
    </nav>
  );
}
