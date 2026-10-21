-- complete_lesson: XP + lesson progress in one transaction.
-- Runs inside a transaction that is rolled back: no data changes. Requires every migration, including 20261018000000_complete_lesson.
-- Run it with `psql`, the Supabase SQL editor, or an isolated local database (see supabase/local-test/README.md). Raises on the first failed check.
--
-- What this cannot show: two sessions racing (one transaction here). supabase/local-test/ runs that with real concurrent connections.
begin;

do $$
declare
  me uuid := gen_random_uuid();
  other uuid := gen_random_uuid();
  r record;
  n integer;
  ev integer;
begin
  insert into auth.users (id, aud, role, email) values (me, 'authenticated', 'authenticated', me || '@complete.test');
  insert into auth.users (id, aud, role, email) values (other, 'authenticated', 'authenticated', other || '@complete.test');

  -- 1. first completion: full XP, progress row created, ledger and total agree
  select * into r from public.complete_lesson(me, 'premier-prompt', 40, 8, 100, 1, current_date, 20);
  if r.paid <> 40 or r.total_xp <> 40 or not r.first_completion or not r.awarded then raise exception 'FAIL 1a: %', r; end if;
  if not exists (select 1 from public.lesson_progress where user_id = me and lesson_id = 'premier-prompt' and attempts = 1 and xp_earned = 40 and best_score = 100)
    then raise exception 'FAIL 1b: progress row wrong'; end if;

  -- 2. repeat inside the window: nothing paid, attempts + 1, best score kept, xp_earned unchanged, not a first completion
  select * into r from public.complete_lesson(me, 'premier-prompt', 40, 8, 60, 1, current_date, 20);
  if r.paid <> 0 or r.total_xp <> 40 or r.first_completion then raise exception 'FAIL 2a: %', r; end if;
  if not exists (select 1 from public.lesson_progress where user_id = me and lesson_id = 'premier-prompt' and attempts = 2 and xp_earned = 40 and best_score = 100)
    then raise exception 'FAIL 2b: progress after repeat wrong'; end if;

  -- 3. repeat after the window: the replay amount (p_xp_repeat) is paid
  update public.xp_events set created_at = now() - interval '21 hours' where user_id = me and source = 'lesson' and ref = 'premier-prompt';
  select * into r from public.complete_lesson(me, 'premier-prompt', 40, 8, 100, 1, current_date, 20);
  if r.paid <> 8 or r.total_xp <> 48 or r.first_completion then raise exception 'FAIL 3a: %', r; end if;
  if not exists (select 1 from public.lesson_progress where user_id = me and lesson_id = 'premier-prompt' and attempts = 3 and xp_earned = 48)
    then raise exception 'FAIL 3b: progress after window wrong'; end if;

  -- 4. coherence: profile total = sum of ledger = sum of lesson_progress.xp_earned
  select (select xp from public.profiles where id = me) as profile_xp,
         (select coalesce(sum(amount), 0) from public.xp_events where user_id = me) as ledger_xp,
         (select coalesce(sum(xp_earned), 0) from public.lesson_progress where user_id = me) as progress_xp
    into r;
  if not (r.profile_xp = r.ledger_xp and r.ledger_xp = r.progress_xp) then raise exception 'FAIL 4: totals differ: %', r; end if;

  -- 5. another learner is unaffected
  select count(*) into n from public.lesson_progress where user_id = other;
  if n <> 0 then raise exception 'FAIL 5: other learner touched'; end if;

  -- 6. invalid parameters are refused and change nothing
  begin
    perform public.complete_lesson(me, 'x', 501, 8, 100, 1, current_date, 20);
    raise exception 'FAIL 6a: amount 501 accepted';
  exception when others then if sqlerrm not like 'complete_lesson: amount out of range%' then raise; end if; end;
  begin
    perform public.complete_lesson(me, 'x', 10, 2, 101, 1, current_date, 20);
    raise exception 'FAIL 6b: score 101 accepted';
  exception when others then if sqlerrm not like 'complete_lesson: score out of range%' then raise; end if; end;
  begin
    perform public.complete_lesson(me, '', 10, 2, 50, 1, current_date, 20);
    raise exception 'FAIL 6c: empty lesson accepted';
  exception when others then if sqlerrm not like 'complete_lesson: invalid lesson id%' then raise; end if; end;
  begin
    perform public.complete_lesson(me, 'x', 10, 2, 50, 1, current_date, 99999);
    raise exception 'FAIL 6d: huge window accepted';
  exception when others then if sqlerrm not like 'complete_lesson: replay window out of range%' then raise; end if; end;
  begin
    perform public.complete_lesson(null, 'x', 10, 2, 50, 1, current_date, 20);
    raise exception 'FAIL 6e: null user accepted';
  exception when others then if sqlerrm not like 'complete_lesson: missing argument%' then raise; end if; end;
  select count(*) into n from public.xp_events where user_id = me and ref = 'x';
  if n <> 0 then raise exception 'FAIL 6f: a refused call left an event'; end if;

  -- 7. FAILURE while the XP is being awarded: no profile for the learner -> error, and no ledger event survives
  begin
    perform public.complete_lesson(gen_random_uuid(), 'premier-prompt', 40, 8, 100, 1, current_date, 20);
    raise exception 'FAIL 7a: unknown learner accepted';
  exception when others then
    -- an unknown user violates the foreign key of xp_events, or finds no profile: either way, refused
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- 8. FAILURE while the progress is being written: the XP of this call must be rolled back with it
  create function pg_temp.boom() returns trigger language plpgsql as $f$ begin raise exception 'boom: progress write failed'; end $f$;
  create trigger boom_progress before insert or update on public.lesson_progress for each row execute function pg_temp.boom();
  select xp into ev from public.profiles where id = me;
  begin
    perform public.complete_lesson(me, 'autre-cours', 30, 6, 100, 1, current_date, 20);
    raise exception 'FAIL 8a: progress failure was swallowed';
  exception when others then
    if sqlerrm not like 'boom:%' then raise; end if;
  end;
  drop trigger boom_progress on public.lesson_progress;
  if (select xp from public.profiles where id = me) <> ev then raise exception 'FAIL 8b: XP survived a failed progress write'; end if;
  if exists (select 1 from public.xp_events where user_id = me and ref = 'autre-cours') then raise exception 'FAIL 8c: ledger event survived'; end if;
  if exists (select 1 from public.lesson_progress where user_id = me and lesson_id = 'autre-cours') then raise exception 'FAIL 8d: progress row survived'; end if;
  -- and the retry is a clean first completion, paid in full
  select * into r from public.complete_lesson(me, 'autre-cours', 30, 6, 100, 1, current_date, 20);
  if r.paid <> 30 or not r.first_completion then raise exception 'FAIL 8e: retry after failure: %', r; end if;

  -- 9. rights: learners and anonymous visitors cannot call it, nor read another learner's data through it
  set local role authenticated;
  begin
    perform public.complete_lesson(me, 'pirate', 500, 500, 100, 1, current_date, 20);
    reset role;
    raise exception 'FAIL 9a: authenticated could call complete_lesson';
  exception when insufficient_privilege then reset role; end;
  set local role anon;
  begin
    perform public.complete_lesson(me, 'pirate', 500, 500, 100, 1, current_date, 20);
    reset role;
    raise exception 'FAIL 9b: anon could call complete_lesson';
  exception when insufficient_privilege then reset role; end;
  if exists (select 1 from public.lesson_progress where lesson_id = 'pirate') then raise exception 'FAIL 9c: a refused call wrote data'; end if;

  -- 10. the ACL is exactly service_role + owner
  if has_function_privilege('anon', 'public.complete_lesson(uuid,text,integer,integer,integer,integer,date,integer)', 'execute')
     or has_function_privilege('authenticated', 'public.complete_lesson(uuid,text,integer,integer,integer,integer,date,integer)', 'execute')
     or not has_function_privilege('service_role', 'public.complete_lesson(uuid,text,integer,integer,integer,integer,date,integer)', 'execute')
    then raise exception 'FAIL 10: wrong execute rights'; end if;

  -- 11. the existing award_xp keeps working with its 6 and 7 arguments (daily reviews use it)
  select * into r from public.award_xp(me, 4, 'review', 'daily', 1, current_date);
  select * into r from public.award_xp(me, 4, 'review', 'daily', 1, current_date, 0);
  if r.paid <> 4 then raise exception 'FAIL 11: award_xp changed: %', r; end if;
  if (select count(*) from pg_proc q join pg_namespace m on m.oid = q.pronamespace where m.nspname = 'public' and q.proname = 'award_xp') <> 1
    then raise exception 'FAIL 11b: more than one award_xp'; end if;

  raise notice 'complete_lesson: all checks passed';
end
$$;

rollback;
