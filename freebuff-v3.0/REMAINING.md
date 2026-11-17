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

## 4. The reset flow — verified end to end; one hop left

The reset flow has a real run behind it (see `VERIFICATION.md`): request, email, code exchange,
new password, `/learn` signed in. One thing remains, and no longer two:

- ~~**Local development needs `http://localhost:3000/**` in the redirect allow-list.**~~ **Done.**
  The list is now `https://duolinguo-ia.vercel.app`, `…/auth/callback`,
  `https://duolinguo-ia.onrender.com/`, `https://duolinguo-ia.onrender.com/**`,
  `http://localhost:3000/`, `http://localhost:3000/**`. Re-checked with `curl -D -`: the same
  `/auth/v1/verify` call that used to come back as the bare site URL now returns
  `Location: http://localhost:3000/login/reset#error=…`. The localhost origin is kept.
- **One reset walked from the production URL is still missing.** The routes are deployed
  (`/login/forgot` answers 200 on Render), but walking it needs an inbox, so it was not done from
  `https://duolinguo-ia.onrender.com`. Nothing suggests it would fail: the same code path, the same
  Supabase project, and the `onrender.com` origin is allow-listed.

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

The live security headers are no longer a gap: `curl -D -` against the Render origin returns HSTS,
`nosniff`, `X-Frame-Options: DENY`, the referrer policy and the permissions policy. Still missing:
one reset walked from the production URL, and a re-run of `content:check` (no content file
changed). Details in `VERIFICATION.md`. Neither is a known failure; they are checks that have not
happened yet.

## 8. Repository state

- `37cd605` (`wip: sauvegarde du travail en cours sur la landing et l'authentification`, 21 files
  against `3e80cba`) then `74743f0` (`docs(v3.0): …`, this folder and the regenerated patch) are on
  `main` and on `origin/main`.
- Render deployed `74743f0` automatically (`autoDeploy: commit` on `main`).
- The first commit also carries the `.claude/skills/**` deletions and the new skill folders. They
  predate this work; they went in with it because the commit was made from the whole worktree.
- `changes.patch` was regenerated against `3e80cba`;
  `git apply --check --reverse` exits 0 on the current tree.

## Suggested order for Claude

1. Read `BEFORE-AFTER.md`, then `git apply --check --reverse freebuff-v3.0/changes.patch`.
2. Decide on CSP with the Supabase URL in hand (item 5).
3. Walk one reset from `https://duolinguo-ia.onrender.com/login/forgot` with a real inbox (item 4).
