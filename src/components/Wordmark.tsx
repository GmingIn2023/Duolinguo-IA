import Link from "next/link";

export function Wordmark({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-baseline gap-2" aria-label="Gusgus.ia, accueil" translate="no">
      <span className={`display ${small ? "text-[1.375rem]" : "text-[1.625rem]"} leading-none`}>gusgus<span className="text-[0.62em] tracking-[-0.02em]">.ia</span></span>
      {!small && <span className="hidden text-[0.8125rem] text-muted sm:inline">Way of Learning AI</span>}
    </Link>
  );
}
