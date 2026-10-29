import { ChevronDown } from "lucide-react";
import { TOOLS } from "@/content/tools";
import type { ToolId } from "@/content/types";
import { typesetContent } from "@/lib/typo";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** One short card per tool: name, maker, what it is good for. The longer facts fold away, with their date. */
export function ToolCards({ toolIds }: { toolIds: ToolId[] }) {
  const oldest = toolIds.map((id) => TOOLS[id].lastVerified).sort()[0];
  return (
    <div className="grid gap-3">
      {toolIds.map((id) => {
        const t = typesetContent(TOOLS[id]);
        return (
          <details key={id} className="tile group overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
              <span className="grid flex-1 gap-0.5">
                <span className="display display-xs">{t.name}</span>
                <span className="text-sm text-muted">{t.goodFor[0]}</span>
              </span>
              <ChevronDown className="size-5 flex-none transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="grid gap-3 border-t border-line px-4 pb-4 pt-3 text-[0.9375rem] text-ink-2">
              <p>{t.summary}</p>
              <ul className="grid gap-1">
                {t.watchOut.slice(0, 2).map((g) => <li key={g} className="flex gap-2"><span aria-hidden className="mt-[0.6em] size-1.5 flex-none rounded-full bg-fox" />{g}</li>)}
              </ul>
              <p className="text-sm text-muted">{t.maker}</p>
            </div>
          </details>
        );
      })}
      <p className="meta">Touche un outil pour le détail. Infos vérifiées le {fmt(oldest)}.</p>
    </div>
  );
}
