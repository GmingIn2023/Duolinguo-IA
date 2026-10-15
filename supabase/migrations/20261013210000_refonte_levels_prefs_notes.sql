-- Refonte : niveau sur 10, préférences, carnet de notes, reprise d'un cours.
-- Additive only: no existing column, row or policy is changed, so the previous app version keeps working
-- (the xp_events.source check only gains a value). Idempotent: safe to re-run.
-- Apply BEFORE deploying the new app version (it selects the new columns and writes 'checkpoint' events).

-- 1. Profile: estimated level out of 10 and learner preferences ------------------------------
alter table public.profiles
  add column if not exists level10 smallint check (level10 between 0 and 10),
  add column if not exists preferences jsonb not null default '{}'::jsonb;
-- Not added to the column-level UPDATE grant: both are written by the server only
-- (the level decides what can be skipped; preferences are validated before being stored).

-- 2. Personal notebook --------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text,
  section_id text,
  body text not null check (char_length(body) between 1 and 2000),
  color text not null default 'canary' check (color in ('canary', 'leaf', 'vermilion', 'sky', 'lilac')),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_recent_idx on public.notes (user_id, pinned desc, updated_at desc);
alter table public.notes enable row level security;
drop policy if exists "own notes read" on public.notes;
create policy "own notes read" on public.notes for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.notes from anon, authenticated;
grant select on public.notes to authenticated;
grant all on public.notes to service_role;

-- 3. Where a learner stopped inside a lesson ------------------------------------------------
create table if not exists public.lesson_resume (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  section_index smallint not null check (section_index between 0 and 50),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table public.lesson_resume enable row level security;
drop policy if exists "own resume read" on public.lesson_resume;
create policy "own resume read" on public.lesson_resume for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.lesson_resume from anon, authenticated;
grant select on public.lesson_resume to authenticated;
grant all on public.lesson_resume to service_role;

-- 4. Checkpoint bonus: paid once per checkpoint, enforced by the database ---------------------
-- award_xp inserts with "on conflict do nothing": this partial unique index makes a second claim
-- (replay or concurrent submission) a no-op that returns awarded = false, like the weekly bonus.
do $$
declare c record;
begin
  -- drop the source check whatever its generated name (expected: xp_events_source_check)
  for c in
    select conname from pg_constraint
     where conrelid = 'public.xp_events'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%source%'
  loop
    execute format('alter table public.xp_events drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.xp_events add constraint xp_events_source_check check (source in ('lesson', 'review', 'weekly', 'checkpoint'));
create unique index if not exists xp_events_checkpoint_once on public.xp_events (user_id, ref) where source = 'checkpoint';

-- 5. Signup trigger: also copy the level out of 10 computed by the placement test -------------
-- The metadata comes from auth.signUp and can be forged by calling the Auth API directly. Every
-- value is therefore clamped or whitelisted, and a malformed value falls back instead of failing
-- the signup. A forged level10 only lets that learner skip lessons on their own board (the test's
-- answer key ships to the browser anyway, so it grants nothing a learner could not click through).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_level10 smallint;
  v_placement smallint;
  v_onboarding jsonb := new.raw_user_meta_data->'onboarding';
begin
  begin
    v_level10 := least(greatest((new.raw_user_meta_data->>'level10')::smallint, 0), 10);
  exception when others then
    v_level10 := null;
  end;
  begin
    v_placement := least(greatest((new.raw_user_meta_data->>'placement_level')::smallint, 1), 3);
  exception when others then
    v_placement := null;
  end;
  if v_onboarding is null or jsonb_typeof(v_onboarding) <> 'object' or pg_column_size(v_onboarding) > 4096 then
    v_onboarding := '{}'::jsonb;
  end if;
  insert into public.profiles (id, display_name, track_id, placement_level, level10, onboarding)
  values (
    new.id,
    nullif(left(btrim(new.raw_user_meta_data->>'display_name'), 80), ''),
    case when new.raw_user_meta_data->>'track_id' in ('bird','gecko','fox') then new.raw_user_meta_data->>'track_id' else null end,
    coalesce(v_placement, 1),
    v_level10,
    v_onboarding
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
