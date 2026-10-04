-- Security test: learners cannot write their own XP, streak or progress; the server (service_role) can.
-- Runs inside a transaction that is rolled back: no data changes.
-- Run it with the Supabase SQL editor, `psql`, or the Supabase MCP `execute_sql`.
-- Creates two throwaway users inside the transaction. Raises an exception on the first failed check.
begin;

do $$
declare
  me uuid;
  other uuid;
  n int;
  r record;
  before_xp int;

  -- statement must fail with "permission denied"
  denied text[] := array[
    'update public.profiles set xp = 999999 where id = %1$L',
    'update public.profiles set streak_days = 999 where id = %1$L',
    'update public.profiles set last_active_date = current_date + 1 where id = %1$L',
    'update public.profiles set placement_level = 3 where id = %1$L',
    'insert into public.profiles (id) values (gen_random_uuid())',
    'delete from public.profiles where id = %1$L',
    'insert into public.xp_events (user_id, amount, source) values (%1$L, 1000, ''lesson'')',
    'update public.xp_events set amount = 1000 where user_id = %1$L',
    'delete from public.xp_events where user_id = %1$L',
    'insert into public.lesson_progress (user_id, lesson_id, xp_earned) values (%1$L, ''x'', 1000)',
    'update public.lesson_progress set xp_earned = 1000 where user_id = %1$L',
    'insert into public.review_items (user_id, question_id, lesson_id, due_at) values (%1$L, ''x'', ''x'', now())',
    'update public.review_items set box = 6 where user_id = %1$L',
    'select public.award_xp(%1$L, 100, ''lesson'', ''hack'', 1, current_date)'
  ];
  stmt text;
  who text;
begin
  -- two throwaway learners (the handle_new_user trigger creates their profiles)
  me := gen_random_uuid();
  other := gen_random_uuid();
  insert into auth.users (id, aud, role, email)
  values (me, 'authenticated', 'authenticated', me || '@lock.test'),
         (other, 'authenticated', 'authenticated', other || '@lock.test');

  -- 1. authenticated (signed-in learner) and anon: every write is denied
  foreach who in array array['authenticated', 'anon'] loop
    perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', who)::text, true);
    perform set_config('request.jwt.claim.sub', me::text, true);
    execute format('set local role %I', who);
    foreach stmt in array denied loop
      begin
        execute format(stmt, me);
        raise exception 'FAIL (%): not denied: %', who, format(stmt, me);
      exception when insufficient_privilege then null;
      end;
    end loop;
    reset role;
  end loop;

  -- 2. authenticated may still change its own track and name, and only its own
  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.profiles set track_id = 'fox', display_name = 'Test' where id = me;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: own track update affected % rows', n; end if;
  update public.profiles set track_id = 'fox' where id = other;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: cross-user track update affected % rows', n; end if;
  -- reads stay scoped to the learner
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'FAIL: learner sees % profiles', n; end if;
  reset role;

  -- 3. service_role (the server) credits XP atomically
  set local role service_role;
  select xp into before_xp from public.profiles where id = me;
  select * into r from public.award_xp(me, 20, 'lesson', 'test-lesson', 3, current_date);
  if not r.awarded or r.total_xp <> before_xp + 20 or r.streak_days <> 3 then
    raise exception 'FAIL: award_xp lesson returned %', r;
  end if;

  -- weekly bonus: once per week, enforced by the unique index
  select * into r from public.award_xp(me, 30, 'weekly', '2099-W01', 3, current_date);
  if not r.awarded or r.total_xp <> before_xp + 50 then raise exception 'FAIL: first weekly bonus %', r; end if;
  select * into r from public.award_xp(me, 30, 'weekly', '2099-W01', 3, current_date);
  if r.awarded or r.total_xp <> before_xp + 50 then raise exception 'FAIL: weekly bonus paid twice %', r; end if;

  -- out-of-range amounts are refused
  begin
    perform public.award_xp(me, 100000, 'lesson', 'x', 1, current_date);
    raise exception 'FAIL: huge award accepted';
  exception when raise_exception then
    if sqlerrm not like 'award_xp: amount out of range%' then raise; end if;
  end;
  begin
    perform public.award_xp(me, -5, 'lesson', 'x', 1, current_date);
    raise exception 'FAIL: negative award accepted';
  exception when raise_exception then
    if sqlerrm not like 'award_xp: amount out of range%' then raise; end if;
  end;
  reset role;
end;
$$;

select 'progress_lock: all checks passed' as result;
rollback;
