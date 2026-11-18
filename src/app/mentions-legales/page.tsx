import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeading, LegalPage } from "@/components/LegalPage";
import { LEGAL, legalReady, legalValue } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: legalReady ? undefined : { index: false, follow: false },
};

// The CSP nonce changes on every request: a statically rendered page cannot carry it.
export const dynamic = "force-dynamic";

export default function Page() {
  const { publisher, host, processor } = LEGAL;

  return (
    <LegalPage title="Mentions légales." updated="18 novembre 2026">
      <LegalHeading>Éditeur du site</LegalHeading>
      <p>
        Le site Gusgus.ia est édité par <strong>{legalValue(publisher.name)}</strong>,{" "}
        {legalValue(publisher.status)}.
      </p>
      <ul className="grid gap-1">
        <li>Adresse : {legalValue(publisher.address)}</li>
        <li>Email : {legalValue(publisher.email)}</li>
        <li>Téléphone : {legalValue(publisher.phone)}</li>
        <li>Immatriculation : {legalValue(publisher.registration)}</li>
        <li>TVA intracommunautaire : {legalValue(publisher.vat)}</li>
      </ul>

      <LegalHeading>Directeur de la publication</LegalHeading>
      <p>{legalValue(publisher.publicationDirector)}</p>

      <LegalHeading>Hébergement</LegalHeading>
      <p>
        Le site est hébergé par <strong>{host.name}</strong>, {host.address}. Téléphone : {host.phone}.{" "}
        <a href={host.site} className="font-semibold text-ink underline" rel="noreferrer noopener" target="_blank">
          {host.site}
        </a>
        .
      </p>
      <p>
        Les comptes, la progression et les notes sont stockés par <strong>{processor.name}</strong>,{" "}
        {processor.address}, dans une région hébergée à Paris.
      </p>

      <LegalHeading>Propriété intellectuelle</LegalHeading>
      <p>
        Les cours, les textes, les questions, les illustrations, les mascottes et la marque Gusgus sont
        protégés par le droit d&apos;auteur. Toute reproduction ou réutilisation, même partielle, en
        dehors d&apos;un usage personnel, est interdite sans autorisation écrite.
      </p>

      <LegalHeading>Responsabilité</LegalHeading>
      <p>
        Les contenus ont une visée pédagogique. Ils ne constituent ni un conseil juridique, ni un
        conseil médical ou financier, ni une garantie de résultat. Les liens vers des sites tiers
        n&apos;engagent pas l&apos;éditeur.
      </p>

      <LegalHeading>Données personnelles et cookies</LegalHeading>
      <p>
        Le détail est dans la <Link href="/confidentialite" className="font-semibold text-ink underline">politique de confidentialité</Link>{" "}
        et sur la page <Link href="/cookies" className="font-semibold text-ink underline">cookies</Link>.
      </p>

      <LegalHeading>Vente et médiation</LegalHeading>
      <p>
        Aucune vente en ligne n&apos;est proposée à ce jour. Le jour où ce sera le cas, les conditions
        générales de vente, le droit de rétractation et le médiateur de la consommation compétent
        devront figurer ici avant la mise en vente.
      </p>
    </LegalPage>
  );
}
