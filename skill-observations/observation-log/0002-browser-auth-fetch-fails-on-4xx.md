---
id: 2
title: Browser-side Supabase auth calls fail as network errors on 4xx through the sandbox proxy; do auth in Server Actions
status: open
type: internal
skill: []
proposes_skill: []
target_file: [README.md]
siblings_checked: none
area: Next.js + Supabase auth forms
date: 2026-10-04
session_context: Gusgus MVP login error state
commands_verified: "run: browser fetch to /auth/v1/token with bad password → 'Failed to fetch' (curl via proxy returns 400)"
---
Client-side `signInWithPassword` with wrong credentials surfaced as a fetch failure and left the form stuck
on "Connexion…" (no catch). Moving login/signup to Server Actions with try/catch fixed both the sandbox
artifact and the missing error path. General lesson: every awaited auth call needs a catch branch that
resets pending state.
