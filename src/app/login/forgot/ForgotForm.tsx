"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { AuthLayout, FormError } from "@/components/AuthLayout";
import { requestPasswordReset, type AuthState } from "@/app/auth/actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, { error: null } as AuthState);

  const aside = (
    <div className="flex h-full flex-col justify-end p-12 text-paper">
      <p className="display display-xl">On te remet sur les rails.</p>
    </div>
  );

  if (state.sentTo) {
    return (
      <AuthLayout title="Vérifie ta boîte mail." aside={aside}>
        <div className="grid gap-5">
          <MailCheck className="size-10" aria-hidden />
          <p className="lede">
            Si un compte existe pour <strong className="text-ink">{state.sentTo}</strong>, tu recevras un lien pour choisir un nouveau mot de passe d&apos;ici quelques minutes.
          </p>
          <p className="text-[0.9375rem] text-muted">Rien reçu ? Regarde dans les spams. Le lien expire au bout d&apos;une heure.</p>
          <Link href="/login" className="font-semibold text-ink underline">Retour à la connexion</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Mot de passe oublié." aside={aside}>
      <p className="-mt-4 text-ink-2">Indique l&apos;adresse email de ton compte : on t&apos;envoie un lien pour en choisir un nouveau.</p>
      <form className="grid gap-4" action={action}>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Email</span>
          <input name="email" type="email" required autoComplete="email" spellCheck={false} className="field" defaultValue={state.values?.email} aria-invalid={Boolean(state.error) || undefined} aria-describedby={state.error ? "auth-error" : undefined} />
        </label>
        <FormError message={state.error} />
        <button className="btn btn-primary btn-lg mt-2" disabled={pending}>{pending ? "Envoi…" : "Envoyer le lien"}</button>
      </form>
      <p className="text-ink-2">Tu t&apos;en souviens ? <Link href="/login" className="font-semibold text-ink underline">Se connecter</Link></p>
    </AuthLayout>
  );
}
