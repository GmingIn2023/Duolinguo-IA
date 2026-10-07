"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AuthLayout, FormError } from "@/components/AuthLayout";
import { login, type AuthState } from "@/app/auth/actions";

export function LoginForm() {
  const params = useSearchParams();
  const initial: AuthState = { error: params.get("error") === "link" ? "Ce lien a expiré ou a déjà servi. Connecte-toi directement." : null };
  const [state, action, pending] = useActionState(login, initial);

  const aside = (
    <div className="flex h-full flex-col justify-end p-12 text-paper">
      <p className="display display-xl">Content de te revoir.</p>
    </div>
  );

  return (
    <AuthLayout title="Connexion." aside={aside}>
      <form className="grid gap-4" action={action}>
        <input type="hidden" name="next" value={params.get("next") ?? "/learn"} />
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Email</span>
          <input name="email" type="email" required autoComplete="email" spellCheck={false} className="field" defaultValue={state.values?.email} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Mot de passe</span>
          <input name="password" type="password" required autoComplete="current-password" className="field" aria-invalid={Boolean(state.error) || undefined} />
        </label>
        <FormError message={state.error} />
        <button className="btn btn-primary btn-lg mt-2" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</button>
      </form>
      <p className="text-ink-2">Pas encore de compte ? <Link href="/onboarding" className="font-semibold text-ink underline">Trouver mon parcours</Link></p>
    </AuthLayout>
  );
}
