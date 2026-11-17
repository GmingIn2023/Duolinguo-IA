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

## 4. A real end-to-end auth test — blocked on an inbox

No real signup, login or password reset was performed. Supabase has zero profiles. To close this:

1. Use a real address you control.
2. Sign up, open the confirmation email, land on `/learn`.
3. Sign out, sign in again.
4. Request a reset on `/login/forgot`, follow the email, set a new password.
5. Confirm the `profiles` row and that XP survives a reload.

The reset flow added here is the only part of that chain that has never run in production.

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

No browser click-through, no live header check, no content sweep re-run. Details and reasons in
`VERIFICATION.md`. None of these are failures; they are checks that have not happened yet.

## 8. Repository state

- Worktree is **uncommitted**: 12 modified files, 7 new source files, plus this folder.
- Nothing was pushed. Nothing was deployed.
- `.claude/skills/**` shows a large set of deletions in `git status`. **They were already there
  before this work began** and were left untouched. Do not sweep them into a commit by accident;
  `git add -A` would.
- `git add -N` was used once, only to make `changes.patch` include the new files, and the index was
  reset afterwards. The worktree is the source of truth.

## Suggested order for Claude

1. Read `BEFORE-AFTER.md`, then `git apply --check freebuff-v3.0/changes.patch`.
2. Run the real reset flow with an inbox (item 4). That is the highest-value unverified path.
3. Decide on CSP with the Supabase URL in hand (item 5).
4. Commit, excluding `.claude/skills/**`.
