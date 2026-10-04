"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthLayout, FormError } from "@/components/AuthLayout";
import { Avatar } from "@/components/Avatar";
import { TRACKS, isTrackId } from "@/content";
import { signup, type AuthState } from "@/app/auth/actions";

function readOnboarding() {
  try {
    return JSON.stringify(JSON.parse(sessionStorage.getItem("gusgus.onboarding") ?? "{}").answers ?? {});
  } catch {
    return "{}";
  }
}

export function SignupForm() {
  const params = useSearchParams();
  const track = isTrackId(params.get("track")) ? (params.get("track") as keyof typeof TRACKS) : null;
  const level = params.get("level") ?? "1";
  const [state, action, pending] = useActionState(signup, { error: null } as AuthState);
  const [retry, setRetry] = useState(0);

  const t = track ? TRACKS[track] : null;
  const aside = t && (
    <div className="flex h-full flex-col justify-end gap-6 p-12">
      <span className="grid size-28 place-items-center rounded-3xl bg-surface shadow-[0_6px_0_var(--accent-deep)]">
        <Avatar track={t.id} size={88} />
      </span>
      <p className="display display-l max-w-[12ch]">{t.name}</p>
      <p className="max-w-[40ch] text-lg">{t.pitch}</p>
    </div>
  );

  if (state.sentTo && retry === 0) {
    return (
      <AuthLayout title="Vérifie ta boîte mail." track={track ?? undefined} aside={aside}>
        <div className="grid gap-5">
          <MailCheck className="size-10" aria-hidden />
          <p className="lede">On a envoyé un lien de confirmation à <strong className="text-ink">{state.sentTo}</strong>. Ouvre-le pour activer ton compte : tu arriveras directement sur ton parcours.</p>
          <p className="text-[0.9375rem] text-muted">Rien reçu après quelques minutes ? Regarde dans les spams, ou <button className="font-semibold text-ink underline" onClick={() => setRetry(1)}>recommence avec une autre adresse</button>.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crée ton compte." track={track ?? undefined} aside={aside}>
      {t ? (
        <p className="-mt-4 text-ink-2">Parcours choisi : <strong className="text-ink">{t.animal} · {t.name}</strong>. <Link href="/onboarding" className="underline">Changer</Link></p>
      ) : (
        <p className="-mt-4 text-ink-2">Tu choisiras ton parcours juste après. <Link href="/onboarding" className="underline">Ou réponds à 4 questions</Link> pour qu&apos;on te le propose.</p>
      )}
      <form className="grid gap-4" action={(fd) => { fd.set("onboarding", readOnboarding()); setRetry(0); return action(fd); }}>
        <input type="hidden" name="track" value={track ?? ""} />
        <input type="hidden" name="level" value={level} />
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Prénom</span>
          <input name="name" required autoComplete="given-name" className="field" placeholder="Camille" defaultValue={state.values?.name} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Email</span>
          <input name="email" type="email" required autoComplete="email" spellCheck={false} className="field" placeholder="camille@exemple.fr" defaultValue={state.values?.email} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Mot de passe</span>
          <input name="password" type="password" required autoComplete="new-password" className="field" aria-describedby="pw-hint" />
          <span id="pw-hint" className="text-sm text-muted">8 caractères minimum.</span>
        </label>
        <FormError message={state.error} />
        <button className="btn btn-primary btn-lg mt-2" disabled={pending}>{pending ? "Création du compte…" : "Créer mon compte"}</button>
      </form>
      <p className="text-ink-2">Déjà un compte ? <Link href="/login" className="font-semibold text-ink underline">Se connecter</Link></p>
    </AuthLayout>
  );
}
