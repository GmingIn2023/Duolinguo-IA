import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Créer un compte" };

// The CSP nonce changes on every request: a statically rendered page cannot carry it.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
