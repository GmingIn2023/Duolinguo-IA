# Verification

Everything below was run in `C:\Dev\Duolinguo-IA` on 2026-11-17, against the worktree described
in `README.md`. Outputs are verbatim except for trimmed blank lines.

## Local checks

| Check | Command | Result |
|-------|---------|--------|
| Types | `npm run typecheck` | exit 0, no output |
| Lint | `npm run lint` | exit 0, no output |
| Unit tests | `npm test` | **289 passed, 8 skipped** (15 files), exit 0 |
| Production build | `npm run build` | exit 0 |

Test breakdown at the time of the run: 14 files passed, 1 skipped. The skip is the pre-existing
Playwright-style suite gate, not a disabled test added here.

Build output confirms the new routes exist and are typed:

```
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /auth/callback
├ ƒ /courses
├ ƒ /courses/[theme]
├ ○ /dev/preview
├ ƒ /jeu
├ ƒ /learn
├ ƒ /learn/chapitres
├ ƒ /lesson/[id]
├ ○ /login
├ ○ /login/forgot
├ ƒ /login/reset
├ ƒ /map
├ ƒ /notes
├ ƒ /onboarding
├ ○ /opengraph-image
├ ƒ /profile
├ ƒ /review
├ ƒ /review/[mode]
├ ○ /robots.txt
├ ○ /signup
└ ○ /sitemap.xml
```

Two things this proves beyond "it compiles":

1. `○ /opengraph-image` means the image was **rendered at build time**. Satori executed the JSX
   and produced a PNG; a malformed node or an unsupported style would have failed the build. The
   artifact is on disk: `.next/server/app/opengraph-image.body`, **67,966 bytes** — a full-size
   1200×630 image, not a placeholder.
2. `○ /robots.txt` and `○ /sitemap.xml` were generated as static output, so both route handlers
   return real content, not a 404.

Note: the build ran with no `.env.local` present (only `.env.example`). The public pages and the
metadata routes therefore build without any Supabase secret, which is the desired property.

## What was checked live, earlier in this work

These were confirmed against the deployed services, not locally:

- Supabase project `yskiozjbvjzcneylwcji` reports `ACTIVE_HEALTHY` in `eu-west-3`.
- Auth health endpoint returns **200** with the publishable key.
- A password grant with a fake account returns **400 `invalid_credentials`** — the auth service is
  answering, not timing out.
- The live login page now renders **"Email ou mot de passe incorrect. Vérifie-les, ou crée un
  compte."** for that case, where it previously surfaced a transport error.
- Render service is live at commit `3e80cba`. `AuthRetryableFetchError: fetch failed` entries in
  the log predate the restart and have not recurred.
- All 7 migrations are applied remotely; `award_xp` has its 7-argument signature and
  `complete_lesson` exists.
- Two confirmed accounts exist and carry real progress (`profiles` 2, `lesson_progress` 9,
  `review_items` 51, `xp_events` 12, `notes` 5). The site is in use.

## End-to-end password reset — exercised for real

Run on 2026-11-17 between 21:26 and 21:30 UTC, on the local dev server (`http://localhost:3000`)
against the live Supabase project, with `val.leg.poi@icloud.com`.

| Step | What happened | Evidence |
|------|---------------|----------|
| 1 | `/login/forgot`, submit the address | neutral "Vérifie ta boîte mail." screen; `POST /login/forgot` 200 |
| 2 | Supabase accepts and sends | `auth.users.recovery_sent_at = 2026-11-17 21:26:48` |
| 3 | Open the emailed link | `303` from `/auth/v1/verify`, carrying a one-time `code` |
| 4 | `/auth/callback?next=/login/reset&code=…` | `307` to `/login/reset`; the PKCE verifier cookie from step 1 was accepted |
| 5 | Submit a new password | `POST /login/reset` 200, `updatePassword` runs |
| 6 | Land signed in | `GET /learn` 200, "Bonjour Matthias." with real XP, streak and review counts |

Supabase side: `last_sign_in_at` moved to `21:28:57` (the code exchange) and `updated_at` to
`21:30:31` (the password write); `recovery_sent_at` was cleared once the token had been used.

**Two deviations, both environmental, neither in the app code:**

1. The emailed link's `redirect_to` came back as the bare `https://duolinguo-ia.onrender.com`
   instead of the localhost callback. GoTrue substitutes the project **Site URL** when the
   requested redirect is not allow-listed, and `http://localhost:3000/**` is not. Confirmed with
   `curl -D -`: the localhost request returned
   `Location: https://duolinguo-ia.onrender.com?code=…`, while the `onrender.com/auth/callback`
   request kept its path. Production is unaffected; local development needs
   `http://localhost:3000/**` in Authentication → URL Configuration → Redirect URLs. Because of
   this, the `code` was handed to the local callback directly, so the Supabase → app redirect hop
   itself was observed only against the production URL.
2. The final submit was fired with `form.requestSubmit()`. Two real clicks and an Enter keypress
   on "Enregistrer" produced no POST in this automation session, while the identical button on
   `/login/forgot` submitted normally. A DOM probe showed the button visible, enabled,
   `type="submit"`, inside the form, with nothing overlapping it. The server action path is
   proven; the physical click on that one button is not.

## What was NOT verified

Being explicit, because these are the gaps a reviewer should close first:

1. **The security headers were not observed on a live response.** They are configured in
   `next.config.ts` and the build accepts the config; a `curl -I` against Render after deploy is
   the check that closes this.
2. **`npm run content:check`** (the 47-lesson sweep, ~5 min) was not re-run, because no content
   file was touched by this work. It passed earlier in the audit.
3. **The production redirect hop.** The reset was completed locally by handing the emailed `code`
   to our own callback; the hop through Render happens only once the new routes are deployed.
4. **The OG card by eye.** Its rendering is proven by the build and its tags by the built HTML,
   not by a visual check.

## Reproducing

```bash
cd C:\Dev\Duolinguo-IA
npm run typecheck
npm run lint
npm test
npm run build
```

To inspect the diff:

```bash
git apply --check --reverse freebuff-v3.0/changes.patch   # exit 0: patch matches the worktree
git diff --stat -- src next.config.ts
```

Run on the current tree: `REVERSE_EXIT=0`. The patch contains **7 `new file mode` entries**
(`login/forgot` page + form, `login/reset` page + form, `opengraph-image.tsx`, `robots.ts`,
`sitemap.ts`) and **665 lines across 21 files**.

To see the new screens locally, `.env.local` with the two public Supabase variables is enough
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), then `npm run dev` and open
`/login/forgot`. Without them the app still starts; `/login/reset` shows its "Lien expiré." state
because the session lookup fails closed.
