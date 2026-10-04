-- Applied to project "gusgus" (yskiozjbvjzcneylwcji) on 2026-10-04.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  track_id text check (track_id in ('bird','gecko','fox')),
  placement_level smallint not null default 1 check (placement_level between 1 and 3),
  onboarding jsonb not null default '{}'::jsonb,
  xp integer not null default 0 check (xp >= 0),
  streak_days integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  best_score smallint not null default 0 check (best_score between 0 and 100),
  attempts integer not null default 0,
  xp_earned integer not null default 0,
  first_completed_at timestamptz not null default now(),
  last_completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- Spaced repetition (Leitner boxes)
create table public.review_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  lesson_id text not null,
  box smallint not null default 1 check (box between 1 and 6),
  due_at timestamptz not null,
  lapses integer not null default 0,
  last_reviewed_at timestamptz,
  primary key (user_id, question_id)
);
create index review_items_due_idx on public.review_items (user_id, due_at);

create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  source text not null check (source in ('lesson','review','weekly')),
  ref text,
  created_at timestamptz not null default now()
);
create index xp_events_user_time_idx on public.xp_events (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.review_items enable row level security;
alter table public.xp_events enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "own progress read" on public.lesson_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "own progress write" on public.lesson_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own progress update" on public.lesson_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own reviews read" on public.review_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "own reviews write" on public.review_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own reviews update" on public.review_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own xp read" on public.xp_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "own xp write" on public.xp_events for insert to authenticated with check ((select auth.uid()) = user_id);

-- Auto-create profile on signup, copying onboarding metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, track_id, placement_level, onboarding)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'display_name', ''),
    case when new.raw_user_meta_data->>'track_id' in ('bird','gecko','fox') then new.raw_user_meta_data->>'track_id' else null end,
    coalesce(least(greatest((new.raw_user_meta_data->>'placement_level')::smallint, 1), 3), 1),
    coalesce(new.raw_user_meta_data->'onboarding', '{}'::jsonb)
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;
