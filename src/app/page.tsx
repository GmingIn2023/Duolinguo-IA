import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { LandingDemo } from "@/components/LandingDemo";
import { Wordmark } from "@/components/Wordmark";
import { LESSONS, THEMES, THEME_IDS, TRACKS, TRACK_IDS } from "@/content";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { getViewer } from "@/lib/data";

const LOOP = [
  { t: "Une carte qui se ramifie", d: "Un test de niveau ouvre ce que tu sais déjà. Ensuite, tu choisis ta branche : étudier, travailler, construire." },
  { t: "Des cours qui se manipulent", d: "Schémas à explorer, prompts annotés, exercices à faire dans ton assistant." },
  { t: "Un quiz qui corrige", d: "Tu sais tout de suite pourquoi c'est juste ou faux, même pour une réponse rédigée." },
  { t: "Des révisions qui changent de forme", d: "Une notion revient quand tu risques de l'oublier, sous une autre question. Et ton carnet garde le reste." },
];

const TOOLS = ["ChatGPT", "Claude", "Gemini", "DeepSeek", "Perplexity"];

export default async function Home() {
  const viewer = await getViewer().catch(() => null);
  const cta = viewer ? { href: "/learn", label: "Reprendre mon parcours" } : { href: "/onboarding", label: "Trouver mon niveau" };

  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex h-20 max-w-[90rem] items-center justify-between px-4 sm:px-8">
        <Wordmark />
        <nav className="flex items-center gap-2">
          {!viewer && <Link href="/login" className="btn btn-ghost">Se connecter</Link>}
          <Link href={cta.href} className="btn btn-primary !h-11 !px-5">{viewer ? "Mon parcours" : "Commencer"}</Link>
        </nav>
      </header>

      {/* First viewport: the thesis, three ways in */}
      <section className="mx-auto grid max-w-[90rem] gap-12 px-4 pb-20 pt-8 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-16">
        <div className="flex flex-col gap-8 lg:col-span-7">
          <h1 className="display display-xl">
            <span className="reveal-line"><span>Apprends l&apos;IA</span></span>
            <span className="reveal-line"><span>comme une</span></span>
            <span className="reveal-line"><span>langue.</span></span>
          </h1>
          <p className="lede">{LESSONS.length} cours courts et sourcés, des quiz qui corrigent tes erreurs, des révisions qui reviennent au bon moment. Trois cartes, du tout premier prompt jusqu&apos;aux agents et au RAG.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={cta.href} className="btn btn-primary btn-lg">{cta.label}</Link>
            <span className="text-sm text-muted">Test de niveau · 3 minutes</span>
          </div>
        </div>

        <ul className="grid gap-4 self-end lg:col-span-5" aria-label="Les trois parcours">
          {TRACK_IDS.map((id, i) => {
            const t = TRACKS[id];
            return (
              <li key={id} data-track={id} style={{ marginLeft: `${[0, 2.5, 5][i]}rem` }} className="max-sm:!ml-0">
                <div className="tile-accent tile flex items-center gap-5 p-5 sm:p-6">
                  <span className="grid size-16 flex-none place-items-center rounded-2xl bg-surface sm:size-20">
                    <Avatar track={id} size={56} />
                  </span>
                  <div className="min-w-0">
                    <p className="display display-s">{t.name}</p>
                    <p className="text-sm font-medium">{t.animal} · {t.audience} · {t.nodes.filter((n) => n.lessonId).length} cours</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Proof: a real question */}
      <section className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 pb-20 sm:px-8 lg:grid-cols-12 lg:pb-28">
        <div className="grid gap-5 lg:col-span-5">
          <h2 className="display display-l">Essaie, là, maintenant.</h2>
          <p className="lede">Voici une vraie question d&apos;un cours Gusgus. Réponds&nbsp;: la correction arrive tout de suite, avec l&apos;explication.</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <LandingDemo />
        </div>
      </section>

      {/* The loop */}
      <section className="bg-surface">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-28">
          <h2 className="display display-l mb-12 max-w-[16ch]">Une boucle courte, qui revient au bon moment.</h2>
          <ol className="grid gap-4 lg:grid-cols-6">
            {LOOP.map((s, i) => (
              <li
                key={s.t}
                className={`tile flex flex-col justify-end gap-3 p-6 sm:p-8 ${
                  ["!bg-paper lg:col-span-4 lg:min-h-64", "!bg-paper lg:col-span-2", "!bg-paper lg:col-span-2", "tile-ink lg:col-span-4"][i]
                }`}
              >
                <h3 className="display display-s sm:text-[1.875rem]">{s.t}</h3>
                <p className={`max-w-[40ch] ${i === 3 ? "text-paper/80" : "text-ink-2"}`}>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Concepts first, tools second */}
      <section className="mx-auto grid max-w-[90rem] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
        <div className="grid content-start gap-5 lg:col-span-5">
          <h2 className="display display-l">D&apos;abord comprendre. Ensuite les outils.</h2>
          <p className="lede">Comment un chatbot écrit, pourquoi il invente, comment le briefer, quoi ne jamais lui confier. Puis les outils, avec des infos datées et revérifiées régulièrement.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 self-center sm:grid-cols-3 lg:col-span-6 lg:col-start-7" translate="no">
          {TOOLS.map((t, i) => (
            <li key={t} className={`tile px-5 py-6 text-xl font-semibold sm:text-2xl ${i === 4 ? "col-span-2" : ""}`}>{t}</li>
          ))}
        </ul>
      </section>

      {/* Ten themes */}
      <section className="mx-auto max-w-[90rem] px-4 pb-20 sm:px-8 lg:pb-28">
        <h2 className="display display-l mb-10 max-w-[18ch]">Dix thèmes, de la première question au projet complet.</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {THEME_IDS.map((t) => (
            <li key={t} data-theme={t} className="tile-th tile flex flex-col gap-6 p-5">
              <ThemeGlyph theme={t} size={30} />
              <div className="grid gap-1">
                <p className="display display-xs">{THEMES[t].name}</p>
                <p className="text-sm opacity-85">{THEMES[t].pitch}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="bg-ink text-paper">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-10 px-4 py-16 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="display text-[clamp(4rem,14vw,12rem)] leading-[0.8]">gusgus</p>
          <div className="grid gap-4 lg:justify-items-end">
            <p className="text-paper/80">Way of Learning AI</p>
            <Link href={cta.href} className="btn btn-lg bg-paper text-ink">{cta.label}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
