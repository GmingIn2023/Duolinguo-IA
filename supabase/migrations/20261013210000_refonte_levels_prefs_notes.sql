-- Refonte : niveau sur 10, préférences, carnet de notes, reprise d'un cours.
-- Additive only: no existing column, row or policy is changed, so the previous app version keeps working.
-- Apply BEFORE deploying the new app version (it selects the new columns).

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
create policy "own resume read" on public.lesson_resume for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.lesson_resume from anon, authenticated;
grant select on public.lesson_resume to authenticated;
grant all on public.lesson_resume to service_role;

-- 4. Signup trigger: also copy the level out of 10 computed by the placement test -------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_level10 smallint;
begin
  begin
    v_level10 := least(greatest((new.raw_user_meta_data->>'level10')::smallint, 0), 10);
  exception when others then
    v_level10 := null;
  end;
  insert into public.profiles (id, display_name, track_id, placement_level, level10, onboarding)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'display_name', ''),
    case when new.raw_user_meta_data->>'track_id' in ('bird','gecko','fox') then new.raw_user_meta_data->>'track_id' else null end,
    coalesce(least(greatest((new.raw_user_meta_data->>'placement_level')::smallint, 1), 3), 1),
    v_level10,
    coalesce(new.raw_user_meta_data->'onboarding', '{}'::jsonb)
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
