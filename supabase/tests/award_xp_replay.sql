-- award_xp replay window: a repeat inside the window is paid 0, a different ref is paid, one-off bonuses stay one-off.
-- Runs inside a transaction that is rolled back: no data changes.
-- Requires every migration, including 20261017000000_award_xp_replay_window.
-- Run it with the Supabase SQL editor, `psql`, or the Supabase MCP `execute_sql`. Raises on the first failed check.
--
-- What this cannot show: two sessions racing. That case is covered by the advisory lock
-- (pg_advisory_xact_lock on user, source and ref), which makes the second call wait for the first one's commit.
-- To see it for real, open two sessions, `begin;` and call the function with the same arguments in both:
-- the second blocks until the first commits, then returns paid = 0.
begin;

do $$
declare
  me uuid := gen_random_uuid();
  r record;
begin
  insert into auth.users (id, aud, role, email) values (me, 'authenticated', 'authenticated', me || '@replay.test');

  -- 1. the first claim is paid in full
  select * into r from public.award_xp(me, 40, 'lesson', 'premier-prompt', 1, current_date, 20);
  if r.paid <> 40 or r.total_xp <> 40 or not r.awarded then raise exception 'FAIL 1: first claim not paid: %', r; end if;

  -- 2. the same lesson again inside the window: the event is recorded, nothing is paid
  select * into r from public.award_xp(me, 40, 'lesson', 'premier-prompt', 1, current_date, 20);
  if r.paid <> 0 or r.total_xp <> 40 then raise exception 'FAIL 2: replay was paid: %', r; end if;

  -- 3. another lesson is a separate claim
  select * into r from public.award_xp(me, 30, 'lesson', 'ameliorer-une-reponse', 1, current_date, 20);
  if r.paid <> 30 or r.total_xp <> 70 then raise exception 'FAIL 3: other lesson not paid: %', r; end if;

  -- 4. the same ref under another source is a separate claim
  select * into r from public.award_xp(me, 10, 'review', 'premier-prompt', 1, current_date, 20);
  if r.paid <> 10 or r.total_xp <> 80 then raise exception 'FAIL 4: other source not paid: %', r; end if;

  -- 5. without a window (daily reviews) every call is paid
  select * into r from public.award_xp(me, 4, 'review', 'daily', 1, current_date, 0);
  select * into r from public.award_xp(me, 4, 'review', 'daily', 1, current_date, 0);
  if r.total_xp <> 88 then raise exception 'FAIL 5: daily reviews lost XP: %', r; end if;

  -- 6. a claim older than the window is paid again
  update public.xp_events set created_at = now() - interval '21 hours' where user_id = me and source = 'lesson' and ref = 'premier-prompt';
  select * into r from public.award_xp(me, 40, 'lesson', 'premier-prompt', 1, current_date, 20);
  if r.paid <> 40 then raise exception 'FAIL 6: claim after the window not paid: %', r; end if;

  -- 7. the weekly bonus is one-off, whatever the window
  select * into r from public.award_xp(me, 30, 'weekly', '2026-W42', 1, current_date, 0);
  if not r.awarded or r.paid <> 30 then raise exception 'FAIL 7a: weekly not paid: %', r; end if;
  select * into r from public.award_xp(me, 30, 'weekly', '2026-W42', 1, current_date, 0);
  if r.awarded or r.paid <> 0 then raise exception 'FAIL 7b: weekly paid twice: %', r; end if;

  -- 8. out-of-range inputs are refused
  begin
    perform public.award_xp(me, 501, 'lesson', 'x', 1, current_date, 20);
    raise exception 'FAIL 8a: amount 501 accepted';
  exception when others then
    if sqlerrm not like 'award_xp: amount out of range%' then raise; end if;
  end;
  begin
    perform public.award_xp(me, 10, 'lesson', 'x', 1, current_date, 99999);
    raise exception 'FAIL 8b: huge window accepted';
  exception when others then
    if sqlerrm not like 'award_xp: replay window out of range%' then raise; end if;
  end;

  raise notice 'award_xp replay window: all checks passed';
end;
$$;

rollback;
