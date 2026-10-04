import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[90rem] flex-col px-4 sm:px-8">
      <header className="flex h-20 items-center">
        <Wordmark />
      </header>
      <main className="grid flex-1 content-center gap-6 pb-20">
        <h1 className="display display-xl">Page introuvable.</h1>
        <p className="lede">Ce lien ne mène nulle part, ou plus. Ton parcours, lui, t&apos;attend.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/learn" className="btn btn-primary btn-lg">Revenir au parcours</Link>
          <Link href="/" className="btn btn-secondary btn-lg">Accueil</Link>
        </div>
      </main>
    </div>
  );
}
