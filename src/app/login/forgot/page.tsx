import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false, follow: false } };

// The CSP nonce changes on every request: a statically rendered page cannot carry it.
export const dynamic = "force-dynamic";

export default function Page() {
  return <ForgotForm />;
}
