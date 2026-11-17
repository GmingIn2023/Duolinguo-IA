import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false, follow: false } };

async function hasRecoverySession() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims);
  } catch {
    return false;
  }
}

export default async function Page() {
  if (await hasRecoverySession()) return <ResetForm />;
  return (
    <AuthLayout title="Lien expiré.">
      <div className="grid gap-4">
        <p className="lede">Ce lien a expiré ou a déjà servi. Demande-en un nouveau : ça ne prend que quelques secondes.</p>
        <Link href="/login/forgot" className="btn btn-primary btn-lg mt-2 w-fit">Demander un nouveau lien</Link>
        <p className="text-ink-2">Ou <Link href="/login" className="font-semibold text-ink underline">revenir à la connexion</Link>.</p>
      </div>
    </AuthLayout>
  );
}
