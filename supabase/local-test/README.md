# Isolated local database for the progress tests

A throw-away PostgreSQL 17 (and PostgREST) on `127.0.0.1`, to replay the migrations and run the SQL and integration tests **without any Supabase project**. Connection settings are hard-coded to localhost; nothing here reads `.env` or Supabase keys.

It approximates Supabase (roles `anon`/`authenticated`/`service_role`, `auth.users`, `supabase_migrations.schema_migrations`); it is **not** Supabase (no GoTrue, no Supabase-specific extensions, vanilla PostgREST).

## One-time setup

```bash
cd supabase/local-test
npm install          # its own package.json: embedded-postgres and pg; the app's dependencies are untouched
```

For the API tests, download the PostgREST v14.x binary for your platform from https://github.com/PostgREST/postgrest/releases into `supabase/local-test/.postgrest/` (or set `POSTGREST_BIN`). It is git-ignored.

## Run

Terminal 1 (leave running; wait about 10 seconds until it prints "postgres ready"):

```bash
cd supabase/local-test && node start-db.mjs
```

Terminal 2:

```bash
cd supabase/local-test
node reset.mjs                 # bootstrap + every migration, in order
node run-sql-tests.mjs         # supabase/tests/*.sql + unexpected-state checks of the migrations
node start-api.mjs &           # PostgREST :54330 + supabase-js proxy :54331
cd ../.. && LOCAL_STACK=1 npx vitest run src/lib/progress.local.test.ts   # real chain, concurrency, injected failures
```

`node reset.mjs --upto=20261017000000_award_xp_replay_window.sql` stops before the later migrations, to test the apply order. Stop everything with Ctrl+C; the data directory (`.data`) is wiped at each `start-db.mjs`.

The default `npx vitest run` skips `progress.local.test.ts` (it needs this stack).
