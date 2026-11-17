"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { AuthLayout, FormError } from "@/components/AuthLayout";
import { updatePassword, type AuthState } from "@/app/auth/actions";

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, { error: null } as AuthState);

  const aside = (
    <div className="flex h-full flex-col justify-end p-12 text-paper">
      <p className="display display-xl">Nouveau mot de passe, nouvelle page.</p>
    </div>
  );

  return (
    <AuthLayout title="Nouveau mot de passe." aside={aside}>
      <div className="grid gap-5">
        <KeyRound className="size-10" aria-hidden />
        <p className="-mt-4 text-ink-2">Choisis un mot de passe d&apos;au moins 8 caractères. Tu resteras connecté après l&apos;enregistrement.</p>
        <form className="grid gap-4" action={action}>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Nouveau mot de passe</span>
            <input name="password" type="password" required autoComplete="new-password" minLength={8} className="field" aria-describedby="pw-hint" />
            <span id="pw-hint" className="text-sm text-muted">8 caractères minimum.</span>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Confirme le mot de passe</span>
            <input name="confirm" type="password" required autoComplete="new-password" minLength={8} className="field" aria-invalid={Boolean(state.error) || undefined} aria-describedby={state.error ? "auth-error" : undefined} />
          </label>
          <FormError message={state.error} />
          <button className="btn btn-primary btn-lg mt-2" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
        </form>
      </div>
    </AuthLayout>
  );
}
