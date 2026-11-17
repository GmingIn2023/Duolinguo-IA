"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AuthLayout, FormError } from "@/components/AuthLayout";
import { login, type AuthState } from "@/app/auth/actions";

export function LoginForm() {
  const params = useSearchParams();
  const errorParam = params.get("error");
  const initial: AuthState = {
    error: errorParam === "link"
      ? "Ce lien a expiré ou a déjà servi. Connecte-toi directement."
      : errorParam === "service"
        ? "Le service de connexion est momentanément indisponible. Réessaie dans un instant."
        : null,
  };
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
          <input name="email" type="email" required autoComplete="email" spellCheck={false} className="field" defaultValue={state.values?.email} aria-invalid={Boolean(state.error) || undefined} aria-describedby={state.error ? "auth-error" : undefined} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Mot de passe</span>
          <input name="password" type="password" required autoComplete="current-password" className="field" aria-invalid={Boolean(state.error) || undefined} aria-describedby={state.error ? "auth-error" : undefined} />
        </label>
        <div className="flex justify-end">
          <Link href="/login/forgot" className="text-sm font-semibold text-ink underline">Mot de passe oublié ?</Link>
        </div>
        <FormError message={state.error} />
        <button className="btn btn-primary btn-lg mt-2" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</button>
      </form>
      <p className="text-ink-2">Pas encore de compte ? <Link href="/onboarding" className="font-semibold text-ink underline">Trouver mon parcours</Link></p>
    </AuthLayout>
  );
}
