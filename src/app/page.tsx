import Link from "next/link";
import { Caveat } from "next/font/google";
import { HeroScene } from "@/components/landing/HeroScene";
import { LandingPlacement } from "@/components/landing/LandingPlacement";
import { Wordmark } from "@/components/Wordmark";
import { LESSONS, THEMES, THEME_IDS, TRACKS, TRACK_IDS } from "@/content";
import { ThemeGlyph } from "@/components/ThemeGlyph";
import { getViewer } from "@/lib/data";
import { PLACEMENT_LENGTH } from "@/lib/placement";
import "./landing.css";

// handwriting for rare annotations only (arrows, "clique sur ton guide")
const hand = Caveat({ subsets: ["latin"], weight: "600", variable: "--font-hand", display: "swap" });

const LOOP = [
  { t: "Une carte qui se ramifie", d: "Un test de niveau ouvre ce que tu sais déjà. Ensuite, tu choisis ta branche : étudier, travailler, construire." },
  { t: "Des cours qui se manipulent", d: "Schémas à explorer, prompts annotés, exercices à faire dans ton assistant." },
  { t: "Un quiz qui corrige", d: "Tu sais tout de suite pourquoi c'est juste ou faux, même pour une réponse rédigée." },
  { t: "Des révisions qui changent de forme", d: "Une notion revient quand tu risques de l'oublier, sous une autre question. Et ton carnet garde le reste." },
];

const TOOLS = ["ChatGPT", "Claude", "Gemini", "DeepSeek", "Perplexity"];

export default async function Home() {
  const viewer = await getViewer().catch(() => null);
  const cta = viewer ? { href: "/learn", label: "Reprendre mon parcours" } : { href: "/onboarding", label: "Dis-moi où j'en suis" };
  const guides = TRACK_IDS.map((id) => ({
    id,
    name: TRACKS[id].name,
    animal: TRACKS[id].animal,
    audience: TRACKS[id].audience,
    lessons: TRACKS[id].nodes.filter((n) => n.lessonId).length,
  }));

  return (
    <div className={`landing overflow-x-clip ${hand.variable}`}>
      <header className="mx-auto flex h-20 max-w-[90rem] items-center justify-between px-4 sm:px-8">
        <Wordmark />
        <nav className="flex items-center gap-1 sm:gap-2">
          {!viewer && <Link href="/login" className="btn btn-ghost max-sm:!px-2.5 max-sm:text-[0.9375rem]"><span className="sm:hidden">Connexion</span><span className="max-sm:hidden">Se connecter</span></Link>}
          <Link href={cta.href} className="btn btn-primary !h-11 !px-5 max-sm:!px-3.5 max-sm:text-[0.9375rem]">{viewer ? "Mon parcours" : "Commencer"}</Link>
        </nav>
      </header>

      {/* First viewport: the thesis, and three guides that are three ways in */}
      <section className="mx-auto grid max-w-[90rem] items-center gap-12 px-4 pb-20 pt-6 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-10">
        <div className="flex flex-col gap-7 lg:col-span-7">
          <h1 className="display display-xl hero-title">
            <span className="reveal-line"><span>Apprends l&apos;IA</span></span>
            <span className="reveal-line"><span>comme une</span></span>
            <span className="reveal-line"><span><span className="hl">langue</span>.</span></span>
          </h1>
          <p className="lede">{LESSONS.length} cours, des quiz qui t&apos;expliquent tes erreurs, des révisions qui reviennent avant que tu oublies. Du tout premier prompt jusqu&apos;aux agents et au RAG.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={viewer ? cta.href : "#depart"} className="btn btn-primary btn-lg">{cta.label}</Link>
          </div>
          {!viewer && <p className="text-sm text-muted">{PLACEMENT_LENGTH} questions qui s&apos;adaptent à toi, un niveau sur 10, aucun compte pour commencer.</p>}
        </div>
        <div className="lg:col-span-5">
          <HeroScene guides={guides} href={viewer ? cta.href : "#depart"} />
        </div>
      </section>

      {/* Where to start: the real level test, or a direct choice. Signed-in learners already have a map. */}
      {!viewer && (
        <section id="depart" className="mx-auto max-w-[90rem] scroll-mt-6 px-4 pb-20 sm:px-8 lg:pb-28">
          <div className="mb-10 grid max-w-[40rem] gap-3">
            <p className="eyebrow">Par où commencer ?</p>
            <h2 className="display display-l">Fais le point en {PLACEMENT_LENGTH} questions, ou choisis toi-même.</h2>
          </div>
          <LandingPlacement guides={guides} />
        </section>
      )}

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
