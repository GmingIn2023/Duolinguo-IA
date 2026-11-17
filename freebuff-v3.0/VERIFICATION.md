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
- Public tables exist and are empty (`profiles`, `lesson_progress`, `lesson_resume`, `notes`,
  `review_items`, `xp_events` — 0 rows each), which is consistent with a site that has no real
  signups yet.

## What was NOT verified

Being explicit, because these are the gaps a reviewer should close first:

1. **The full reset flow has not been exercised end to end.** It needs a real inbox: request the
   link on `/login/forgot`, receive the Supabase email, follow it through
   `/auth/callback?next=/login/reset`, submit a new password, land on `/learn`. The code path is
   the same `exchangeCodeForSession` used by signup confirmation, but "same code path" is not
   "tested".
2. **No real signup or login was performed.** There is no test inbox and Supabase has zero
   profiles. Everything about the authenticated experience is unproven in this session.
3. **No browser click-through.** The pages were built and the routes exist; nobody tabbed through
   the new forms or looked at the OG card in a debugger. `opengraph-image` rendering is proven by
   the build, not by eye.
4. **The security headers were not observed on a live response.** They are configured in
   `next.config.ts` and the build accepts the config; a `curl -I` against Render after deploy is
   the check that closes this.
5. **`npm run content:check`** (the 47-lesson sweep, ~5 min) was not re-run, because no content
   file was touched by this work. It passed earlier in the audit.

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

Run on this worktree: `REVERSE_EXIT=0`. The patch contains **7 `new file mode` entries**
(`login/forgot` page + form, `login/reset` page + form, `opengraph-image.tsx`, `robots.ts`,
`sitemap.ts`) and 662 lines total, so nothing untracked was left out of the record.

To see the new screens locally, `.env.local` with the two public Supabase variables is enough
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), then `npm run dev` and open
`/login/forgot`. Without them the app still starts; `/login/reset` shows its "Lien expiré." state
because the session lookup fails closed.
