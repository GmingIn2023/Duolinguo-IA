/**
 * The publisher's legal identity. Everything here is public.
 *
 * Empty fields are rendered as « [à compléter] ». `legalReady` stays false until the six required
 * fields are filled: the footer links, the sitemap entries and the robots tag all follow it, so an
 * unfinished legal page is never published and never indexed. Filling this file is the one legal
 * task a human must do; see freebuff-v3.0/ETAPE-2-SECURITE-LEGAL-2026-11-18.md.
 */
export const LEGAL = {
  publisher: {
    name: "", // « Prénom Nom » for an EI, « Gusgus SAS » for a company
    status: "", // « Entrepreneur individuel (EI) » / « SAS au capital de 1 000 € »
    address: "",
    email: "",
    phone: "",
    registration: "", // RNE / RCS + SIREN, when registered
    vat: "", // « FR12345678901 », only when liable
    publicationDirector: "",
  },
  host: {
    name: "Render Services, Inc.",
    address: "525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis",
    phone: "+1 443 799 0238",
    site: "https://render.com",
  },
  processor: {
    name: "Supabase Pte. Ltd.",
    address: "970 Toa Payoh North #07-04, Singapour 318992",
    site: "https://supabase.com",
  },
  cnil: {
    name: "CNIL",
    address: "3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07",
    site: "https://www.cnil.fr/fr/plaintes",
  },
} as const;

const REQUIRED = ["name", "status", "address", "email", "phone", "publicationDirector"] as const;

export const legalReady = REQUIRED.every((key) => LEGAL.publisher[key].trim().length > 0);

export const legalLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
] as const;

/** Never invents an identity: an empty field reads as a visible to-do. */
export const legalValue = (value: string) => (value.trim() ? value : "[à compléter]");
