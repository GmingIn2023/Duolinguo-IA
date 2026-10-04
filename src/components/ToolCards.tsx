import { TOOLS } from "@/content/tools";
import type { ToolId } from "@/content/types";
import { typesetContent } from "@/lib/typo";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function ToolCards({ toolIds }: { toolIds: ToolId[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 [&>*:last-child:nth-child(odd)]:sm:col-span-2">
      {toolIds.map((id) => {
        const t = typesetContent(TOOLS[id]);
        return (
          <article key={id} className="tile flex flex-col gap-4 p-5">
            <header>
              <h3 className="display display-s">{t.name}</h3>
              <p className="text-sm text-muted">{t.maker}</p>
            </header>
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">{t.summary}</p>
            <div className="grid gap-3 text-[0.9375rem]">
              <div>
                <p className="mb-1 font-semibold">Utile pour</p>
                <ul className="grid gap-1 text-ink-2">
                  {t.goodFor.map((g) => <li key={g} className="flex gap-2"><span aria-hidden className="mt-[0.6em] size-1.5 flex-none rounded-full bg-ink" />{g}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-semibold">Attention</p>
                <ul className="grid gap-1 text-ink-2">
                  {t.watchOut.map((g) => <li key={g} className="flex gap-2"><span aria-hidden className="mt-[0.6em] size-1.5 flex-none rounded-full bg-fox" />{g}</li>)}
                </ul>
              </div>
            </div>
            <p className="mt-auto text-[0.8125rem] text-muted">Infos vérifiées le {fmt(t.lastVerified)}</p>
          </article>
        );
      })}
    </div>
  );
}
