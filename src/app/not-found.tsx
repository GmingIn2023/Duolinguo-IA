import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

// Without this, Next prerenders the 404 at build time and its scripts cannot carry the request nonce.
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-lg content-center gap-6 px-4 py-16">
      <Wordmark href="/" />
      <p className="display display-l">Cette page n&apos;existe pas.</p>
      <p className="lede">Le lien est peut-être ancien, ou l&apos;adresse contient une faute.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary btn-lg">
          Retour à l&apos;accueil
        </Link>
        <Link href="/login" className="btn btn-secondary btn-lg">
          Se connecter
        </Link>
      </div>
    </div>
  );
}
