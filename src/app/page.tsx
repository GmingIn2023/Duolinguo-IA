import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { LandingDemo } from "@/components/LandingDemo";
import { Wordmark } from "@/components/Wordmark";
import { TRACKS, TRACK_IDS } from "@/content";
import { getViewer } from "@/lib/data";

const LOOP = [
  { t: "Un cours de 5 minutes", d: "Une idée à la fois, des schémas, des exemples concrets." },
  { t: "Un quiz qui corrige", d: "Tu sais tout de suite pourquoi c'est juste ou faux, et tes erreurs reviennent." },
  { t: "Des XP et une série", d: "Ta progression est sauvegardée, cours après cours." },
  { t: "Des révisions au bon moment", d: "Chaque jour ce qui est dû, et 10 minutes par semaine sur ce que tu viens d'apprendre." },
];

const TOOLS = ["ChatGPT", "Claude", "Gemini", "DeepSeek", "Perplexity"];

export default async function Home() {
  const viewer = await getViewer().catch(() => null);
  const cta = viewer ? { href: "/learn", label: "Reprendre mon parcours" } : { href: "/onboarding", label: "Trouver mon parcours" };

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
          <p className="lede">Des cours de 5 minutes, des quiz qui corrigent tes erreurs, des révisions qui reviennent au bon moment. Trois parcours, du tout premier pas jusqu&apos;à l&apos;usage pro.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={cta.href} className="btn btn-primary btn-lg">{cta.label}</Link>
            <span className="text-sm text-muted">5 questions · 1 minute</span>
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
                    <p className="text-sm font-semibold">{t.animal} · {t.audience}</p>
                    <p className="display display-s">{t.name}</p>
                    <p className="text-sm">{t.lessonIds.length} cours</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Proof: a real question */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
          <div className="grid gap-5 lg:col-span-5">
            <h2 className="display display-l">Essaie, là, maintenant.</h2>
            <p className="lede">Voici une vraie question d&apos;un cours Gusgus. Réponds : la correction arrive tout de suite, avec l&apos;explication.</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <LandingDemo />
          </div>
        </div>
      </section>

      {/* The loop: a real sequence, so it is numbered */}
      <section className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-28">
        <h2 className="display display-l mb-12 max-w-[16ch]">Une boucle courte, qui revient au bon moment.</h2>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((s, i) => (
            <li key={s.t} className={`tile flex min-h-56 flex-col justify-between gap-8 p-6 ${i === 3 ? "tile-ink" : ""}`}>
              <span className="display text-5xl">{i + 1}</span>
              <div>
                <h3 className="mb-1.5 text-lg font-semibold">{s.t}</h3>
                <p className={i === 3 ? "text-paper/80" : "text-ink-2"}>{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Concepts first, tools second */}
      <section className="mx-auto grid max-w-[90rem] gap-10 px-4 pb-20 sm:px-8 lg:grid-cols-12 lg:pb-28">
        <div className="grid content-start gap-5 lg:col-span-5">
          <h2 className="display display-l">D&apos;abord comprendre. Ensuite les outils.</h2>
          <p className="lede">Comment un chatbot écrit, pourquoi il invente, comment le briefer, quoi ne jamais lui confier. Puis les outils, avec des infos datées et revérifiées régulièrement.</p>
        </div>
        <ul className="flex flex-wrap content-start gap-3 lg:col-span-6 lg:col-start-7">
          {TOOLS.map((t) => (
            <li key={t} className="tile px-6 py-4 text-xl font-semibold sm:text-2xl">{t}</li>
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
