import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Se connecter" };

// The CSP nonce changes on every request: a statically rendered page cannot carry it.
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
