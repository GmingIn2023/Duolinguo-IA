# What is still open

Honest list. Nothing here was silently dropped.

## 1. P1.1 — skipped by request

The user's instruction was explicit: *"Skip the p1.1 its bad."* It is not implemented, not
half-implemented, and not stubbed. If it comes back later it needs a fresh decision, not a patch
dug out of this worktree.

## 2. Content depth (P1.2) — not started

The 47 lessons are short by design and the audit flagged that some tracks run thin. Adding depth
means writing new French lesson content, which collides with the standing rule *"we keep what
Claude did, just repair some parts, don't change formulations."* So it was left alone. It is a
content decision for the owner, not a code repair.

## 3. Legal and privacy pages — blocked on missing facts

There is no legal notice, no privacy page, and no cookie statement. These cannot be invented: they
need a legal entity name, an address, a contact email and a hosting statement. Blocked on the
owner, not on engineering.

## 4. The reset flow — verified; two environment gaps left

The reset flow now has a real run behind it (see `VERIFICATION.md`): request, email, code exchange,
new password, `/learn` signed in. Two things remain, neither of them app code:

- **Local development needs `http://localhost:3000/**` in Supabase → Authentication → URL
  Configuration → Redirect URLs.** Without it GoTrue rewrites the callback to the production Site
  URL, which is correct in production and useless locally.
- **The production redirect hop is still unobserved**, because the new routes are not deployed yet.
  The first deploy closes it.

Signup with email confirmation, ordinary login and the authenticated app were already exercised
earlier; `/learn` renders a real account with XP, streak and review counts.

## 5. Content-Security-Policy — deliberately deferred

`next.config.ts` now sends `nosniff`, `X-Frame-Options: DENY`, a referrer policy, a permissions
policy and HSTS. It does **not** send a CSP. Next injects inline bootstrap scripts and the app talks
to Supabase, so a correct policy needs a nonce or hash setup and a `connect-src` for the project
URL. Writing one blind risks a blank page in production. This is the next security step, not a
finished one.

## 6. Render blueprint drift — needs dashboard access

See `INFRA.md`. The live service has no health check and builds with `npm install`, while
`render.yaml` says `npm ci --include=dev` and `/login`. Reconciling them means changing the service,
not the file, and that was outside what could be done safely here.

## 7. Verification gaps

Live security headers (needs a deploy), the production redirect hop, and a re-run of
`content:check` (no content file changed). Details in `VERIFICATION.md`. None of these are
failures; they are checks that have not happened yet.

## 8. Repository state

- The work is committed locally as `37cd605` (`wip: sauvegarde du travail en cours sur la landing
  et l'authentification`), 21 files against `3e80cba`.
- Nothing was pushed. Nothing was deployed.
- That commit also carries the `.claude/skills/**` deletions and the new skill folders. They
  predate this work; they went in with it because the commit was made from the whole worktree.
- `changes.patch` was regenerated against `3e80cba` after that commit;
  `git apply --check --reverse` exits 0 on the current tree.

## Suggested order for Claude

1. Read `BEFORE-AFTER.md`, then `git apply --check --reverse freebuff-v3.0/changes.patch`.
2. Decide on CSP with the Supabase URL in hand (item 5).
3. Deploy, then `curl -I` the origin for the headers and walk one reset from the production URL
   (item 4).
