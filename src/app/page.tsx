import Link from "next/link";
import { Caveat } from "next/font/google";
import { HeroScene } from "@/components/landing/HeroScene";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingPlacement } from "@/components/landing/LandingPlacement";
import { SleepingFooter } from "@/components/landing/SleepingFooter";
import { ThemePlan } from "@/components/landing/ThemePlan";
import { TokenDemo } from "@/components/landing/TokenDemo";
import { Wordmark } from "@/components/Wordmark";
import { LESSONS, TRACKS, TRACK_IDS } from "@/content";
import { getViewer } from "@/lib/data";
import { buildLandingPlan } from "@/lib/landingBoard";
import { buildPreviews } from "@/lib/landingPreview";
import { PLACEMENT_LENGTH } from "@/lib/placement";
import "./landing.css";
import "./landing-how.css";
import "./landing-close.css";

// handwriting for rare annotations only (arrows, "clique sur ton guide")
const hand = Caveat({ subsets: ["latin"], weight: "600", variable: "--font-hand", display: "swap" });

const TOOLS = ["ChatGPT", "Claude", "Gemini", "DeepSeek", "Perplexity"];

export default async function Home() {
  const viewer = await getViewer().catch(() => null);
  const cta = viewer ? { href: "/learn", label: "Reprendre mon parcours" } : { href: "/onboarding", label: "Dis-moi où j'en suis" };
  const plan = buildLandingPlan();
  const previews = buildPreviews();
  const guides = TRACK_IDS.map((id) => ({
    id,
    name: TRACKS[id].name,
    animal: TRACKS[id].animal,
    audience: TRACKS[id].audience,
    lessons: TRACKS[id].chapters.reduce((n, c) => n + c.lessons.length, 0),
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
          {!viewer && <p className="text-sm text-muted">{PLACEMENT_LENGTH} questions, environ 3 minutes, aucun compte pour commencer.</p>}
        </div>
        <div className="lg:col-span-5">
          <HeroScene guides={guides} href={viewer ? cta.href : "#depart"} />
        </div>
      </section>

      {/* Where to start: the real level test, or a direct choice. Signed-in learners already have a map. */}
      {!viewer && (
        <section id="depart" className="mx-auto max-w-[90rem] scroll-mt-6 px-4 pb-20 sm:px-8 lg:pb-28">
          <div className="mb-10 grid max-w-[40rem] gap-3">
            <h2 className="display display-l">Fais le point en {PLACEMENT_LENGTH} questions, ou choisis toi-même.</h2>
          </div>
          <LandingPlacement guides={guides} />
        </section>
      )}

      {/* How it works: a thread with four stops, each with a real preview */}
      <section id="comment" className="how-band">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-28">
          <div className="mb-14 grid max-w-[42rem] gap-4">
            <h2 className="display display-l">Tu essaies, tu te trompes, tu comprends. Puis ça revient.</h2>
            <p className="lede">Voici ce que tu verras, étape par étape. Descends : le fil se dessine avec toi.</p>
          </div>
          <HowItWorks previews={previews} />
        </div>
      </section>

      {/* Ten themes and the plan of the three tracks, from the real curriculum */}
      <ThemePlan plan={plan} />

      {/* One idea made visible: a chatbot picks its next word */}
      <section className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:py-28">
        <div className="grid content-start gap-4 lg:col-span-5">
          <h2 className="display display-l">Regarde-le choisir ses mots.</h2>
          <p className="lede">Un chatbot n&apos;a pas de fiche de faits sous les yeux. À chaque mot, il tire parmi les suites possibles : souvent la plus probable, pas toujours.</p>
          <p className="hand text-ink-2">probabilités données pour l&apos;exemple, pas mesurées</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <TokenDemo />
        </div>
      </section>

      {/* The method, in one sentence, and four numbers computed from the real content */}
      <section className="bg-bird-soft">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-8 lg:py-28">
          <figure className="quote mx-auto">
            <span className="quote-mark" aria-hidden>
              <svg viewBox="0 0 80 64"><path d="M2 36C2 17 12 6 30 2l3 8C23 13 19 19 19 26h12v30H2zM46 36C46 17 56 6 74 2l3 8c-10 3-14 9-14 16h12v30H46z" fill="currentColor" /></svg>
            </span>
            <div>
              <blockquote>
                On n&apos;apprend pas l&apos;IA en lisant des articles. On l&apos;apprend <span className="mk m1">en lui parlant</span>, <span className="mk m2">en repérant ses erreurs</span>, puis <span className="mk m3">en recommençant</span>.
              </blockquote>
              <figcaption>La méthode Gusgus</figcaption>
            </div>
          </figure>
          <ul className="facts" aria-label="Gusgus en chiffres">
            {[
              [String(plan.totalLessons), "cours, du premier prompt aux agents", "bg-surface"],
              [String(plan.themes.length), "thèmes", "bg-sky-soft"],
              [String(TRACK_IDS.length), "parcours, un guide chacun", "bg-gecko-soft"],
              [String(PLACEMENT_LENGTH), "questions pour te placer", "bg-rose-soft"],
            ].map(([n, label, bg]) => (
              <li key={label} className={`fact ${bg}`}>
                <b>{n}</b>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The assistants taught in the lessons */}
      <section className="mx-auto grid max-w-[90rem] justify-items-center gap-5 px-4 py-16 text-center sm:px-8 lg:py-24">
        <h2 className="display display-m max-w-[40rem]">Des assistants qu&apos;on apprend à utiliser correctement, à leur plein potentiel.</h2>
        <ul className="flex flex-wrap justify-center gap-3" translate="no" aria-label="Les assistants abordés">
          {TOOLS.map((t, i) => (
            <li key={t} className={`tools-chip ${["bg-gecko-soft", "bg-fox-soft", "bg-sky-soft", "bg-lilac-soft", "bg-bird-soft"][i]}`}>{t}</li>
          ))}
        </ul>
      </section>

      <footer className="bg-ink text-paper">
        <div className="mx-auto max-w-[90rem] px-4 pb-8 pt-20 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <h2 className="display display-l max-w-[16ch]">Ton premier prompt t&apos;attend.</h2>
            <Link href={viewer ? cta.href : "#depart"} className="btn btn-lg bg-bird text-ink">{viewer ? cta.label : "Faire le test"}</Link>
          </div>
          <div className="mt-12"><SleepingFooter /></div>
          <p className="display mt-6 overflow-hidden pb-[0.12em] text-[clamp(4.5rem,22vw,19rem)] leading-[0.85] tracking-[-0.06em]" aria-hidden>gusgus</p>
          <p className="mt-4 text-paper/80">Apprendre l&apos;IA en français</p>
        </div>
      </footer>
    </div>
  );
}
