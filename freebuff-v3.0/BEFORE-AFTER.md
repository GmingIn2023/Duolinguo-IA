# Before / after

Ordered by what a learner or a crawler actually notices. Every "after" is the code in this
worktree; every "before" is commit `3e80cba`.

---

## C1 — The brand was `Gusgus`, the product is `Gusgus.ia`

**Why.** The audit found three different names in the same session: the wordmark said `gusgus`,
the page title said `Gusgus`, and the project is called `Gusgus.ia`. Nothing else about the
wordmark changed — same font, same size, same tracking.

`src/components/Wordmark.tsx`

```diff
-    <Link href={href} className="group inline-flex items-baseline gap-2" aria-label="Gusgus, accueil" translate="no">
-      <span className={`display ${small ? "text-[1.375rem]" : "text-[1.625rem]"} leading-none`}>gusgus</span>
+    <Link href={href} className="group inline-flex items-baseline gap-2" aria-label="Gusgus.ia, accueil" translate="no">
+      <span className={`display ${small ? "text-[1.375rem]" : "text-[1.625rem]"} leading-none`}>gusgus<span className="text-[0.62em] tracking-[-0.02em]">.ia</span></span>
```

The `.ia` is set at 62 % of the wordmark size, on the same baseline, so the lockup keeps its
width. The accessible name follows the visible text.

`src/app/page.tsx` — the giant footer wordmark gets the same treatment, at 40 %:

```diff
-          <p className="display mt-6 ..." aria-hidden>gusgus</p>
+          <p className="display mt-6 ..." aria-hidden>gusgus<span className="text-[0.4em] tracking-[-0.03em]">.ia</span></p>
```

`src/app/layout.tsx` — metadata:

```diff
-  title: { default: "Gusgus — Way of Learning AI", template: "%s · Gusgus" },
+  metadataBase: new URL(process.env.SITE_URL ?? "https://duolinguo-ia.onrender.com"),
+  title: { default: "Gusgus.ia — Way of Learning AI", template: "%s · Gusgus.ia" },
```

**Effect.** One name everywhere: tab title, share card, screen reader, footer.

---

## C2 — An auth outage took the whole site down

**Why.** `proxy.ts` built the Supabase client and called `getClaims()` at the top of every matched
request, with no `try`. If the auth host was unreachable or an env var was missing, the throw
happened inside the proxy and **every** route returned 500 — including the landing page, which
needs no session. This is exactly the failure mode seen during the Supabase incident.

```diff
 export async function proxy(request: NextRequest) {
   let response = NextResponse.next({ request });
-  const supabase = createServerClient(...);
+  let signedIn = false;
+  let authUnavailable = false;
 
-  const { data } = await supabase.auth.getClaims();
-  const signedIn = Boolean(data?.claims);
+  try {
+    const supabase = createServerClient(...);
+    const { data } = await supabase.auth.getClaims();
+    signedIn = Boolean(data?.claims);
+  } catch {
+    // A missing env var or an unreachable auth service must not 500 public pages.
+    authUnavailable = true;
+  }
 
   if (!signedIn && PROTECTED.some(...)) {
     const url = request.nextUrl.clone();
     url.pathname = "/login";
     url.searchParams.set("next", path);
+    if (authUnavailable) url.searchParams.set("error", "service");
     return NextResponse.redirect(url);
   }
```

**Effect.** Public pages stay up. A protected page sends you to `/login` with `?error=service`,
and `LoginForm` turns that into a sentence instead of the generic "link expired" message:

```diff
-  const initial: AuthState = { error: params.get("error") === "link" ? "Ce lien a expiré ou a déjà servi. Connecte-toi directement." : null };
+  const errorParam = params.get("error");
+  const initial: AuthState = {
+    error: errorParam === "link"
+      ? "Ce lien a expiré ou a déjà servi. Connecte-toi directement."
+      : errorParam === "service"
+        ? "Le service de connexion est momentanément indisponible. Réessaie dans un instant."
+        : null,
+  };
```

This is the repair that turns the previous outage from "site down" into "login temporarily
unavailable", which is the honest state.

---

## C3 — Error messages were invisible to assistive tech, and the reset link led nowhere

### C3a — the error box could not be referenced

`src/components/AuthLayout.tsx`

```diff
-export function FormError({ message }: { message: string | null }) {
+export function FormError({ message, id = "auth-error" }: { message: string | null; id?: string }) {
   if (!message) return null;
   return (
-    <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-[0.9375rem] font-medium text-bad">
+    <p id={id} role="alert" aria-live="polite" className="rounded-xl bg-bad-soft px-4 py-3 text-[0.9375rem] font-medium text-bad">
```

`role="alert"` alone announces the box when it appears, but a screen-reader user who tabs back to
the email field had no way to hear *why* it was rejected. The fields now point at the message:

```diff
-          <input name="email" ... defaultValue={state.values?.email} />
+          <input name="email" ... defaultValue={state.values?.email} aria-invalid={Boolean(state.error) || undefined} aria-describedby={state.error ? "auth-error" : undefined} />
```

Same edit on the login password, the signup name and email, and on the signup password, which
keeps its own hint: `aria-describedby={state.error ? "pw-hint auth-error" : "pw-hint"}`.

### C3b — "Mot de passe oublié ?" was a dead end

Before, there was no reset path at all: no link, no page, no action. A learner who forgot the
password had to create a second account.

Now the link exists on `/login`, and it leads to a page that works:

`src/app/login/LoginForm.tsx`

```diff
+        <div className="flex justify-end">
+          <Link href="/login/forgot" className="text-sm font-semibold text-ink underline">Mot de passe oublié ?</Link>
+        </div>
```

`src/app/auth/actions.ts` — two new server actions:

```ts
export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Indique l'adresse email de ton compte.", values: { email } };

  const h = await headers();
  const origin = process.env.SITE_URL?.replace(/\/$/, "") || (h.get("origin") ?? `https://${h.get("host")}`);
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/login/reset`,
    });
    if (error) return { error: authErrorMessage(error.message), values: { email } };
  } catch (e) {
    return { error: authErrorMessage(e instanceof Error ? e.message : "network"), values: { email } };
  }
  return { error: null, sentTo: email, values: { email } };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "Mot de passe trop court : 8 caractères minimum." };
  if (password !== confirm) return { error: "Les deux mots de passe ne sont pas identiques." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: authErrorMessage(error.message) };
  } catch (e) {
    return { error: authErrorMessage(e instanceof Error ? e.message : "network") };
  }
  redirect("/learn");
}
```

New screens:

- `src/app/login/forgot/page.tsx` + `ForgotForm.tsx` — asks for the email, then always answers
  "Si un compte existe pour … tu recevras un lien", so the page cannot be used to discover which
  addresses have accounts.
- `src/app/login/reset/page.tsx` + `ResetForm.tsx` — the page the recovery link lands on. It
  checks for a session server-side; without one it shows "Lien expiré." with a link to request a
  new one, instead of a form that would fail on submit.

The recovery link reuses the existing `/auth/callback?next=/login/reset`, so the PKCE code
exchange, the cookie write and the `safeNext` guard are the same code path as email confirmation.

**Not changed:** the login and signup wording. Same sentences, same order, same layout.

---

## C4 — Tabs without tabpanels

**Why.** The mobile track selector claimed `role="tablist"` / `role="tab"` / `aria-selected`, but
the elements it controlled were not tabpanels and arrow-key navigation was never implemented.
That is a promise to screen readers the widget does not keep.

`src/components/landing/ThemePlan.tsx`

```diff
-          <div className="mb-5 flex gap-2 md:hidden" role="tablist" aria-label="Parcours">
+          <div className="mb-5 flex gap-2 md:hidden" role="group" aria-label="Parcours">
             {TRACKS.map((t) => (
-              <button key={t} role="tab" type="button" data-track={t} aria-selected={mobileTrack === t} aria-controls={`plan-${t}`} onClick={() => setMobileTrack(t)} className="plan-tab">
+              <button key={t} type="button" data-track={t} aria-pressed={mobileTrack === t} aria-controls={`plan-${t}`} onClick={() => setMobileTrack(t)} className="plan-tab">
```

`src/app/landing.css` follows the attribute:

```diff
-.landing .plan-tab[aria-selected="true"] { background: var(--accent); box-shadow: 0 3px 0 var(--accent-deep); }
+.landing .plan-tab[aria-pressed="true"] { background: var(--accent); box-shadow: 0 3px 0 var(--accent-deep); }
```

**Effect.** Identical pixels; the semantics now match the behaviour. `aria-pressed` on a button is
a complete, honest description of "this one is selected".

---

## C5 — 18 px dots

**Why.** The dots on the plan are buttons. At `1.15rem` they were 18.4 px, below the 24 px minimum
target size (WCAG 2.2 SC 2.5.8).

```diff
-.landing .plan-dot { width: 1.15rem; height: 1.15rem; ... }
+.landing .plan-dot { width: 1.5rem; height: 1.5rem; ... }
```

**Effect.** 24 px exactly. Nothing else in the rule changed, so the visual rhythm of the plan is
preserved; the dots simply read as slightly more present, which is the intent of a control.

---

## C6 — "Relancer" repeated the same word

**Why.** The token demo draws from five candidates. Clicking "Relancer" could return the word
already on screen, which makes a demo about *sampling* look broken.

`src/lib/tokenDemo.ts`

```diff
-  return 0;
+  return TOKEN_CANDIDATES.length - 1;
+}
+
+/** Weighted draw among all candidates except `excluded`, so "Relancer" never repeats the current word. */
+export function pickCandidateExcept(r: number, excluded: number): number {
+  const choices = TOKEN_CANDIDATES.map((candidate, index) => ({ candidate, index })).filter(({ index }) => index !== excluded);
+  const total = choices.reduce((sum, { candidate }) => sum + candidate.p, 0);
+  const target = (Math.min(Math.max(r, 0), 100) / 100) * total;
+  let acc = 0;
+  for (const { candidate, index } of choices) {
+    acc += candidate.p;
+    if (target < acc) return index;
+  }
+  return choices[choices.length - 1]?.index ?? 0;
 }
```

`src/components/landing/TokenDemo.tsx`

```diff
-            setChosen(pickCandidate(Math.random() * 100));
+            setChosen(pickCandidateExcept(Math.random() * 100, chosen));
```

The remaining four candidates keep their **relative** weights (40/22/18/12/8 minus the excluded
one, renormalised over 100), so the demo still shows a plausible distribution rather than a flat
one-in-four.

The `return 0` → `return TOKEN_CANDIDATES.length - 1` fix is the same boundary bug in the original
function: at exactly `r = 100` the loop fell through and returned the *first* candidate. `r` comes
from `Math.random() * 100`, so it could not happen in practice, but the function is now correct on
its whole stated domain.

Tests kept: the original two ("probabilities add up to 100", "every candidate makes a sentence")
plus two new ones covering exclusion across the full range and weight order.

---

## C7 — Sharing the site produced no card

**Why.** `layout.tsx` had an `openGraph` block but no `metadataBase`, so relative image URLs could
not resolve, and there was no image at all. Pasting the link into a chat produced a bare URL.

Before: no `metadataBase`, no `alternates`, no `twitter`, no image, no `robots.txt`, no sitemap.

After, in `src/app/layout.tsx`:

```ts
metadataBase: new URL(process.env.SITE_URL ?? "https://duolinguo-ia.onrender.com"),
title: { default: "Gusgus.ia — Way of Learning AI", template: "%s · Gusgus.ia" },
alternates: { canonical: "/" },
openGraph: {
  type: "website", locale: "fr_FR", url: "/", siteName: "Gusgus.ia",
  title: "Gusgus.ia — Apprends l'IA comme une langue",
  description: "...",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Gusgus.ia — Apprends l'IA comme une langue" }],
},
twitter: { card: "summary_large_image", ... images: ["/opengraph-image"] },
```

New `src/app/opengraph-image.tsx` renders the card with `next/og` in the site's own palette
(`#f1f1ee` paper, black display type, the three track colours as chips):

- 1200×630, wordmark top left, "Way of Learning AI" top right;
- headline "Apprends l'IA comme une langue.";
- three chips: "Cours à pratiquer", "Quiz qui expliquent", "Révisions espacées".

New `src/app/robots.ts` allows the marketing pages and disallows the signed-in app
(`/learn`, `/map`, `/jeu`, `/courses`, `/lesson`, `/review`, `/notes`, `/profile`, `/dev`,
`/auth/`), and points at the sitemap.

New `src/app/sitemap.ts` lists the four public URLs: `/`, `/onboarding`, `/signup`, `/login`.

Both files read the base URL from `SITE_URL` with the Render URL as fallback, so the sitemap is
correct in production without another env var.

---

## C8 — No security headers

**Why.** The response carried `X-Powered-By: Next.js` and none of the baseline headers: no
`nosniff`, no framing policy, no referrer policy, no HSTS.

`next.config.ts`

```diff
 const nextConfig: NextConfig = {
-  /* config options here */
+  poweredByHeader: false,
+  async headers() {
+    return [{ source: "/:path*", headers: securityHeaders }];
+  },
 };
```

with

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];
```

**No CSP yet, on purpose.** Next injects inline bootstrap scripts and Supabase needs
`connect-src`, so a CSP written blind would either be useless or blank the page. It is listed in
`REMAINING.md` as the next security step, not silently skipped.

---

## What was deliberately not changed

- Hero, lesson screens, path, review, notes: no edits.
- Every existing French sentence: untouched.
- Colours, type scale, radii, shadows, spacing: untouched.
- `render.yaml`: untouched, because the live Render service does not match it and changing the
  file alone would not change the service. See `INFRA.md`.
- `.claude/skills/**`: the deletions were already in the worktree before this work.
