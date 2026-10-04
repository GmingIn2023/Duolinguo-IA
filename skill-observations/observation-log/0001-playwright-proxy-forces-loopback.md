---
id: 1
title: Playwright's `proxy` option routes localhost through the sandbox proxy; use Chromium flags instead
status: open
type: internal
skill: [run]
proposes_skill: []
target_file: []
siblings_checked: "family: browser-verification skills; members: run (propagate), impeccable live-browser (assumed)"
area: launching a browser against a local dev server in a proxied cloud sandbox
date: 2026-10-04
session_context: Gusgus MVP e2e tests
commands_verified: "run: chromium.launch({ args: ['--proxy-server=$HTTPS_PROXY', '--proxy-bypass-list=localhost;127.0.0.1'] }) → localhost 200, supabase 401 (reachable)"
---
Playwright adds `<-loopback>` to the bypass list when `proxy` is set, so `http://localhost:3000` hit the
CONNECT-only agent proxy (405). Passing `--proxy-server` / `--proxy-bypass-list` as launch args fixed it.
Cost: ~6 tool calls of debugging. Worth a line in any "run the app in a cloud sandbox" guidance.
