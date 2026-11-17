# Gusgus v3.0 — repair record

This folder is the hand-off for Claude: every change made to the v2 codebase, why it was made,
what it looked like before, what it looks like now, and what is still open.

- `BEFORE-AFTER.md` — change by change, with the old and new source.
- `VERIFICATION.md` — the commands that were run and their real output.
- `INFRA.md` — Supabase and Render state, checked live.
- `REMAINING.md` — what was deliberately not touched, and the known blockers.
- `changes.patch` — the complete code diff (`git diff`), ready to read or apply.

## Scope that was respected

- No redesign. The Tile Table system, layout, spacing and motion are untouched.
- No rewrite of French copy. Existing formulations stay as Claude wrote them; new copy exists only
  on the new password-reset screens and in the two error strings that had no wording at all.
- No domain or DNS change. `Gusgus.ia` is a wordmark and metadata string only.
- No pricing, no payments.
- **P1.1 was skipped** on the user's instruction ("skip the p1.1 its bad").
- Nothing was committed, pushed or deployed. The worktree is the deliverable.

## What changed, in one line each

| # | Change | Files |
|---|--------|-------|
| C1 | Brand reads `gusgus.ia` in the wordmark, the footer and every metadata field | `Wordmark.tsx`, `page.tsx`, `layout.tsx` |
| C2 | An auth outage no longer 500s public pages; protected routes redirect with a readable message | `proxy.ts`, `LoginForm.tsx` |
| C3 | Auth forms: errors are announced and tied to their fields; "Mot de passe oublié ?" exists and works | `AuthLayout.tsx`, `LoginForm.tsx`, `SignupForm.tsx`, `auth/actions.ts`, new `login/forgot`, `login/reset` |
| C4 | The mobile track selector is a group of pressed buttons, not tabs without tabpanels | `ThemePlan.tsx`, `landing.css` |
| C5 | Track dots are 24 px (was 18 px), so they are a real touch target | `landing.css` |
| C6 | "Relancer" on the token demo never repeats the word already shown | `tokenDemo.ts`, `TokenDemo.tsx` |
| C7 | SEO: canonical URL, Open Graph and Twitter cards with a real 1200×630 image, `robots.txt`, `sitemap.xml` | `layout.tsx`, new `opengraph-image.tsx`, `robots.ts`, `sitemap.ts` |
| C8 | Baseline security headers, and `X-Powered-By` removed | `next.config.ts` |

## How to review

1. Read `BEFORE-AFTER.md` first: it is ordered by user-visible impact, not by file.
2. `changes.patch` is the exact `git diff` of the worktree against `3e80cba`, including the 7 new
   files. Because the worktree already contains the changes, verify it with
   `git apply --check --reverse changes.patch` (exit 0 means the patch matches the files exactly).
   On a clean checkout of `3e80cba`, plain `git apply --check changes.patch` is the forward test.
3. `VERIFICATION.md` lists what was proven and, just as important, what was not.

## Status at hand-off

- Worktree: 12 modified files, 7 new source files, uncommitted. `.claude/skills/**` deletions were
  already present before this work and are untouched.
- Typecheck: pass. Lint: pass. Tests: 289 passed, 8 skipped. Production build: pass.
- Ready to commit once you have read it. Not deployed.
