import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, Lock, Star } from "lucide-react";
import { DIFFICULTY_LABEL, LESSONS, THEMES, THEME_IDS, getLesson, isThemeId } from "@/content";
import type { Difficulty, Lesson } from "@/content/types";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { coveredByLevel, isUnlocked } from "@/lib/board";
import { getKnowledge, getResume } from "@/lib/data";
import { FORMAT_LABEL, formatMinutes } from "@/lib/labels";
import { DURATION_BUCKETS, bucketFor, isDurationBucket } from "@/lib/prefs";

export const metadata: Metadata = { title: "Cours" };

type Status = "done" | "covered" | "open" | "locked";
const STATUS_FILTERS: { id: Status | "todo"; label: string }[] = [
  { id: "todo", label: "À faire" },
  { id: "done", label: "Terminés" },
  { id: "locked", label: "Verrouillés" },
];

type Params = { theme?: string; level?: string; time?: string; status?: string };

/** Builds a filter link that toggles one parameter and keeps the others. */
function href(current: Params, key: keyof Params, value: string) {
  const next = { ...current, [key]: current[key] === value ? undefined : value };
  const qs = new URLSearchParams(Object.entries(next).filter((e): e is [string, string] => Boolean(e[1]))).toString();
  return qs ? `/courses?${qs}` : "/courses";
}

export default async function CoursesPage(props: PageProps<"/courses">) {
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const params: Params = {
    theme: isThemeId(sp.theme) ? sp.theme : undefined,
    level: ["1", "2", "3", "4", "5"].includes(sp.level ?? "") ? sp.level : undefined,
    time: isDurationBucket(sp.time) ? sp.time : undefined,
    status: STATUS_FILTERS.some((s) => s.id === sp.status) ? sp.status : undefined,
  };
  const [{ knowledge }, resume] = await Promise.all([getKnowledge(), getResume()]);

  const statusOf = (l: Lesson): Status =>
    knowledge.completed.has(l.id) ? "done" : !isUnlocked(l, knowledge, getLesson) ? "locked" : coveredByLevel(l.difficulty, knowledge.level10) ? "covered" : "open";

  const shown = LESSONS.filter((l) => {
    if (params.theme && l.theme !== params.theme) return false;
    if (params.level && l.difficulty !== Number(params.level)) return false;
    if (params.time && bucketFor(l.durationMin).id !== params.time) return false;
    const s = statusOf(l);
    if (params.status === "todo" && (s === "done" || s === "locked")) return false;
    if (params.status === "done" && s !== "done") return false;
    if (params.status === "locked" && s !== "locked") return false;
    return true;
  });
  const themes = THEME_IDS.filter((t) => shown.some((l) => l.theme === t));
  const filtered = Object.values(params).some(Boolean);

  return (
    <div className="grid max-w-6xl gap-8">
      <header className="grid gap-3">
        <h1 className="display display-l">Tous les cours</h1>
        <p className="lede !max-w-[60ch]">
          {LESSONS.length} cours, de la découverte au projet complet. Filtre par thème, niveau ou durée ; un cours verrouillé te dit quoi faire avant.
        </p>
      </header>

      <div className="grid gap-3" role="group" aria-label="Filtres">
        <FilterRow label="Thème">
          {THEME_IDS.map((t) => (
            <Link key={t} href={href(params, "theme", t)} aria-current={params.theme === t ? "true" : undefined} className="chip" data-theme={t}>
              <ThemeGlyph theme={t} size={16} />
              {THEMES[t].short}
            </Link>
          ))}
        </FilterRow>
        <FilterRow label="Niveau">
          {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
            <Link key={d} href={href(params, "level", String(d))} aria-current={params.level === String(d) ? "true" : undefined} className="chip">
              {DIFFICULTY_LABEL[d]}
            </Link>
          ))}
        </FilterRow>
        <FilterRow label="Durée">
          {DURATION_BUCKETS.map((b) => (
            <Link key={b.id} href={href(params, "time", b.id)} aria-current={params.time === b.id ? "true" : undefined} className="chip">
              {b.label}
            </Link>
          ))}
        </FilterRow>
        <FilterRow label="État">
          {STATUS_FILTERS.map((s) => (
            <Link key={s.id} href={href(params, "status", s.id)} aria-current={params.status === s.id ? "true" : undefined} className="chip">
              {s.label}
            </Link>
          ))}
          {filtered && <Link href="/courses" className="chip !shadow-none underline">Tout effacer</Link>}
        </FilterRow>
      </div>

      <p className="meta" aria-live="polite">{shown.length} cours</p>

      {themes.length === 0 && (
        <div className="tile grid gap-3 p-8">
          <p className="display display-s">Aucun cours avec ces filtres.</p>
          <Link href="/courses" className="btn btn-secondary w-fit">Effacer les filtres</Link>
        </div>
      )}

      {themes.map((t) => (
        <section key={t} data-theme={t} className="grid gap-4" aria-labelledby={`th-${t}`}>
          <div className="flex items-center gap-3">
            <span className="tile-th grid size-10 place-items-center rounded-xl"><ThemeGlyph theme={t} size={22} /></span>
            <div>
              <h2 id={`th-${t}`} className="display display-s">{THEMES[t].name}</h2>
              <p className="text-sm text-muted">{THEMES[t].pitch}</p>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.filter((l) => l.theme === t).map((l) => (
              <li key={l.id}>
                <CourseCard lesson={l} status={statusOf(l)} resumeAt={resume.get(l.id)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 flex-none text-sm font-semibold text-muted">{label}</span>
      <div className="no-scrollbar -my-1 flex gap-2 overflow-x-auto py-1">{children}</div>
    </div>
  );
}

function CourseCard({ lesson: l, status, resumeAt }: { lesson: Lesson; status: Status; resumeAt?: number }) {
  const locked = status === "locked";
  return (
    <Link
      href={`/lesson/${l.id}`}
      data-theme={l.theme}
      className={`tile tile-press flex h-full flex-col gap-3 p-5 ${locked ? "!bg-sunk !shadow-none" : ""}`}
      aria-label={`${l.title}${locked ? " (verrouillé)" : status === "done" ? " (terminé)" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="chip chip-th !min-h-7 !px-2.5 text-[0.8125rem]">{FORMAT_LABEL[l.format]}</span>
        <span className="meta">{DIFFICULTY_LABEL[l.difficulty]}</span>
        <span className="ml-auto">
          {status === "done" && <Check className="size-5 text-good" strokeWidth={3} aria-hidden />}
          {status === "covered" && <Star className="size-5 text-th-deep" aria-hidden />}
          {locked && <Lock className="size-4 text-muted" aria-hidden />}
        </span>
      </div>
      <h3 className={`display display-xs ${locked ? "text-ink-2" : ""}`}>{l.title}</h3>
      <p className="line-clamp-3 text-[0.9375rem] text-ink-2">{l.objective}</p>
      <p className="meta mt-auto flex items-center gap-1.5 pt-1">
        <Clock className="size-3.5" aria-hidden />
        {formatMinutes(l.durationMin)}
        {resumeAt !== undefined && status !== "done" && <span className="ml-auto font-semibold text-ink">En cours</span>}
      </p>
    </Link>
  );
}
