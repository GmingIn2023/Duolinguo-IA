import Link from "next/link";
import { legalLinks, legalReady } from "@/lib/legal";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[46rem] px-4 py-10 sm:px-8 lg:py-16">
      <Link href="/" className="text-sm font-semibold text-ink underline">
        ← Gusgus.ia
      </Link>
      <h1 className="display display-l mt-6">{title}</h1>
      <p className="meta mt-3">Dernière mise à jour : {updated}</p>

      {!legalReady && (
        <p role="status" className="mt-6 rounded-xl bg-bad-soft px-4 py-3 text-[0.9375rem] font-medium text-bad">
          Version de travail, non publiée : l&apos;identité de l&apos;éditeur manque encore. Cette page
          n&apos;est ni liée depuis le site ni indexée.
        </p>
      )}

      <div className="prose-gg mt-8 grid gap-4">{children}</div>

      <nav aria-label="Informations légales" className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm">
        {legalLinks.map((link) => (
          <Link key={link.href} href={link.href} className="font-semibold text-ink underline">
            {link.label}
          </Link>
        ))}
        <Link href="/" className="text-muted underline">
          Retour à l&apos;accueil
        </Link>
      </nav>
    </div>
  );
}

/** Shared heading style, so the three pages stay identical. */
export function LegalHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="display display-s mt-6 text-ink">{children}</h2>;
}
