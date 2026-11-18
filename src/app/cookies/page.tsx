import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeading, LegalPage } from "@/components/LegalPage";
import { LEGAL, legalReady } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookies",
  robots: legalReady ? undefined : { index: false, follow: false },
};

const BROWSERS = [
  { name: "Chrome", href: "https://support.google.com/chrome/answer/95647" },
  { name: "Safari", href: "https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" },
  { name: "Firefox", href: "https://support.mozilla.org/fr/kb/effacer-les-cookies-pour-supprimer-les-informations" },
  { name: "Edge", href: "https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
];

// The CSP nonce changes on every request: a statically rendered page cannot carry it.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <LegalPage title="Cookies." updated="18 novembre 2026">
      <LegalHeading>Ce qui est déposé</LegalHeading>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[0.9375rem]">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-semibold text-ink">Nom</th>
              <th className="py-2 pr-4 font-semibold text-ink">Rôle</th>
              <th className="py-2 pr-4 font-semibold text-ink">Durée</th>
              <th className="py-2 font-semibold text-ink">Consentement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 pr-4 font-mono text-[0.8125rem]">sb-…-auth-token.0 / .1</td>
              <td className="py-2 pr-4">Garder la session ouverte après connexion</td>
              <td className="py-2 pr-4">400 jours, renouvelés à chaque connexion</td>
              <td className="py-2">Non : strictement nécessaire</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2">
        Aucun cookie de mesure d&apos;audience, de publicité ou de réseau social n&apos;est déposé.
        Aucun script tiers n&apos;est chargé.
      </p>

      <LegalHeading>Pourquoi il n&apos;y a pas de bandeau</LegalHeading>
      <p>
        L&apos;article 82 de la loi Informatique et Libertés dispense de consentement les traceurs
        strictement nécessaires au service demandé. Le cookie de session sert uniquement à te garder
        connecté : sans lui, il faudrait retaper ton mot de passe à chaque page. Il ne sert à aucune
        autre fin et n&apos;est transmis à personne.
      </p>

      <LegalHeading>Si la mesure d&apos;audience arrive</LegalHeading>
      <p>
        Deux voies seulement. Soit un bandeau de consentement, avec un refus aussi simple qu&apos;un
        accord. Soit l&apos;exemption prévue par la CNIL, à condition que l&apos;outil serve uniquement
        à mesurer l&apos;audience du site pour son éditeur, produise des statistiques anonymes, ne
        suive pas la navigation hors du site, tronque les adresses IP, vive au plus 13 mois et
        conserve les données au plus 25 mois, avec une information claire et un moyen de s&apos;y
        opposer. Ces conditions sont vérifiées avant tout branchement.
      </p>

      <LegalHeading>Comment supprimer ce cookie</LegalHeading>
      <p>
        Te déconnecter suffit à effacer le cookie de session. Tu peux aussi vider les cookies depuis
        les réglages de ton navigateur :
      </p>
      <ul className="grid gap-1">
        {BROWSERS.map((b) => (
          <li key={b.name}>
            <a href={b.href} className="font-semibold text-ink underline" rel="noreferrer noopener" target="_blank">
              {b.name}
            </a>
          </li>
        ))}
      </ul>
      <p>
        Le détail des traitements est dans la{" "}
        <Link href="/confidentialite" className="font-semibold text-ink underline">
          politique de confidentialité
        </Link>
        . L&apos;éditeur est joignable à l&apos;adresse indiquée dans les{" "}
        <Link href="/mentions-legales" className="font-semibold text-ink underline">
          mentions légales
        </Link>
        {" "}({LEGAL.publisher.email || "[à compléter]"}).
      </p>
    </LegalPage>
  );
}
