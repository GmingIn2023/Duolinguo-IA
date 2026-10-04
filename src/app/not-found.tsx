import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-2xl content-center gap-6 px-4">
      <h1 className="display display-xl">Perdu&nbsp;?</h1>
      <p className="lede">Cette page n&apos;existe pas, ou plus. Ton parcours, lui, t&apos;attend.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/learn" className="btn btn-primary">Revenir au parcours</Link>
        <Link href="/" className="btn btn-secondary">Accueil</Link>
      </div>
    </main>
  );
}
