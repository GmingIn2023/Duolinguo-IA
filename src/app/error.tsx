"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-2xl content-center gap-6 px-4">
      <h1 className="display display-l">Quelque chose a coincé.</h1>
      <p className="lede">{error.message || "Une erreur inattendue s'est produite."} Ta progression déjà enregistrée n&apos;est pas perdue.</p>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" onClick={reset}>Réessayer</button>
        <Link href="/learn" className="btn btn-secondary">Revenir au parcours</Link>
      </div>
    </main>
  );
}
