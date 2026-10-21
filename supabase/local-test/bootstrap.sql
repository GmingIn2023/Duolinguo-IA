-- A Supabase-like environment on a LOCAL isolated PostgreSQL, to replay the repository's migrations.
-- This approximates what Supabase provides; it is not Supabase. Differences are listed in the report.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator noinherit login password 'x';
grant anon, authenticated, service_role to authenticator;

-- the role used by the Supabase SQL editor: NOT a superuser, can create roles, bypasses RLS, member of the API roles
create role postgres login password 'pg' createrole createdb bypassrls;
grant anon, authenticated, service_role to postgres;
alter database postgres owner to postgres;

create schema auth;
create table auth.users (
  id uuid primary key,
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  raw_user_meta_data jsonb,
  created_at timestamptz default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
$$;
grant usage on schema auth to postgres, anon, authenticated, service_role;
grant all on auth.users to postgres;
grant execute on function auth.uid() to postgres, anon, authenticated, service_role;

-- default privileges that Supabase sets for objects created by postgres in public
grant usage on schema public to anon, authenticated, service_role;
alter schema public owner to postgres;
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;

-- the migration history table, same columns as the remote one
create schema supabase_migrations authorization postgres;
create table supabase_migrations.schema_migrations (
  version text not null primary key,
  statements text[],
  name text,
  created_by text,
  idempotency_key text,
  rollback text[]
);
