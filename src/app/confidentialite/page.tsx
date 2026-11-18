import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeading, LegalPage } from "@/components/LegalPage";
import { LEGAL, legalReady, legalValue } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: legalReady ? undefined : { index: false, follow: false },
};

// The CSP nonce changes on every request: a statically rendered page cannot carry it.
export const dynamic = "force-dynamic";

export default function Page() {
  const { publisher, host, processor, cnil } = LEGAL;
  const contact = legalValue(publisher.email);

  return (
    <LegalPage title="Politique de confidentialité." updated="18 novembre 2026">
      <LegalHeading>Qui traite tes données</LegalHeading>
      <p>
        <strong>{legalValue(publisher.name)}</strong>, {legalValue(publisher.address)}. Contact :{" "}
        {contact}. Aucun délégué à la protection des données n&apos;est désigné : le service ne traite
        pas de données sensibles et ne suit pas les personnes à grande échelle.
      </p>

      <LegalHeading>Ce qui est collecté</LegalHeading>
      <ul className="grid gap-2">
        <li>
          <strong>Compte</strong> : adresse email, prénom, mot de passe (conservé haché par Supabase,
          jamais lisible par l&apos;éditeur), parcours choisi et réponses au test de niveau.
        </li>
        <li>
          <strong>Apprentissage</strong> : progression, points d&apos;expérience, éléments à réviser,
          notes personnelles.
        </li>
        <li>
          <strong>Technique</strong> : adresse IP et journaux nécessaires à la sécurité (limitation des
          tentatives de connexion, diagnostic d&apos;incident).
        </li>
      </ul>

      <LegalHeading>Pourquoi, et sur quelle base</LegalHeading>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[0.9375rem]">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-4 font-semibold text-ink">Finalité</th>
              <th className="py-2 font-semibold text-ink">Base légale</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="py-2 pr-4">Créer le compte, enregistrer la progression, les révisions et les notes</td>
              <td className="py-2">Exécution du contrat (art. 6.1.b RGPD)</td>
            </tr>
            <tr className="border-b border-line">
              <td className="py-2 pr-4">Envoyer les emails demandés, dont le lien de réinitialisation</td>
              <td className="py-2">Exécution du contrat</td>
            </tr>
            <tr className="border-b border-line">
              <td className="py-2 pr-4">Protéger le service contre les abus et les intrusions</td>
              <td className="py-2">
                Intérêt légitime : empêcher les attaques par force brute et le spam (art. 6.1.f)
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Mesurer l&apos;audience</td>
              <td className="py-2">Aucune mesure d&apos;audience aujourd&apos;hui</td>
            </tr>
          </tbody>
        </table>
      </div>

      <LegalHeading>Qui reçoit quoi</LegalHeading>
      <p>
        <strong>{processor.name}</strong> héberge la base de données et l&apos;authentification.{" "}
        <strong>{host.name}</strong> héberge l&apos;application. Aucune donnée n&apos;est vendue, louée
        ou utilisée pour de la publicité.
      </p>

      <LegalHeading>Où vont les données</LegalHeading>
      <p>
        La base de données est hébergée à Paris. Le support de Supabase et l&apos;hébergement de
        l&apos;application peuvent impliquer un accès depuis Singapour et les États-Unis. Ces
        transferts sont encadrés par les clauses contractuelles types de la Commission européenne ;
        Render est également certifié au Data Privacy Framework.
      </p>

      <LegalHeading>Combien de temps</LegalHeading>
      <ul className="grid gap-2">
        <li>Compte, progression, révisions et notes : tant que le compte existe.</li>
        <li>Journaux de sécurité : le temps nécessaire à la détection et à l&apos;analyse d&apos;un incident.</li>
        <li>Emails transactionnels : le temps de leur acheminement.</li>
      </ul>

      <LegalHeading>Tes droits</LegalHeading>
      <p>
        Tu peux demander l&apos;accès à tes données, leur rectification, leur effacement, la limitation
        d&apos;un traitement, t&apos;y opposer, ou en demander la portabilité. Écris à {contact} :
        la réponse arrive sous 30 jours. Tu peux aussi introduire une réclamation auprès de la{" "}
        <a href={cnil.site} className="font-semibold text-ink underline" rel="noreferrer noopener" target="_blank">
          {cnil.name}
        </a>
        , {cnil.address}.
      </p>

      <LegalHeading>Âge minimum</LegalHeading>
      <p>
        Le service s&apos;adresse aux personnes de 15 ans et plus. En dessous de 15 ans, l&apos;accord
        du titulaire de l&apos;autorité parentale est nécessaire.
      </p>

      <LegalHeading>Sécurité</LegalHeading>
      <p>
        Le site impose HTTPS. Les mots de passe sont hachés par Supabase et ne sont jamais stockés en
        clair. Chaque compte ne peut lire que ses propres lignes (isolation au niveau de la base), et
        la clé serveur n&apos;est jamais envoyée au navigateur. Les tentatives de connexion sont
        limitées par adresse.
      </p>

      <LegalHeading>Cookies</LegalHeading>
      <p>
        Un seul cookie est déposé : celui de session. Le détail et sa durée sont sur la page{" "}
        <Link href="/cookies" className="font-semibold text-ink underline">cookies</Link>.
      </p>
    </LegalPage>
  );
}
