---
id: 4
title: Supabase MCP execute_sql DELETE statements time out unattended (confirmation gate); neutralise with UPDATE and hand deletion to the user
status: open
type: internal
skill: []
proposes_skill: []
target_file: [README.md]
siblings_checked: none
area: cleaning up test accounts in a hosted Supabase project
date: 2026-10-04
session_context: Gusgus pre-launch audit
commands_verified: "run: delete from auth.users … → timed out after 60s (x2); delete from public.xp_events … → timed out; update auth.users set banned_until … → succeeded; password login → user_banned"
---
Every DELETE through the MCP timed out at 60s with no lock held (pg_stat_activity empty), consistent with the tool's
"destructive statements may require the user to confirm" gate. Workaround: rotate the password to a random value and
ban the account (UPDATE succeeds), then ask the user to delete from the dashboard. Plan cleanup of seeded accounts
for a moment the user is present.
