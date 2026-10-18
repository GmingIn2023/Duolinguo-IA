-- complete_lesson: credit the XP and record the lesson progress in ONE transaction.
--
-- Before: the server called award_xp (one request), then wrote lesson_progress (other requests). If the second step failed,
-- the XP stayed credited with no progress row (and a retry then recorded xp_earned = 0).
-- Now: a single call. Either the XP event, the profile total, the streak AND the lesson_progress row are all written,
-- or none of them is (a PostgreSQL function runs inside one transaction; any error rolls everything back).
--
-- Rules kept exactly as they were in the server code:
-- - the XP for a first completion (p_xp_first) or a replay (p_xp_repeat) is computed by the server (src/lib/xp.ts);
--   the function only picks one, depending on whether the lesson_progress row already exists;
-- - the 20 h replay window, the amount range, the ledger event and the streak are award_xp's (called inside this function);
-- - lesson_progress: best_score = max, attempts + 1, xp_earned + really paid XP.
-- Simultaneous calls for the same learner and lesson queue on an advisory lock: the second one sees the first one's rows.
--
-- Spaced-repetition boxes (review_items) stay outside: they are absolute, idempotent writes done by the server afterwards.
--
-- Requires the 7-argument award_xp (migration 20261017000000). Apply it first. Rights: service_role only, like award_xp.

do $$
begin
  if to_regprocedure('public.award_xp(uuid,integer,text,text,integer,date,integer)') is null then
    raise exception 'complete_lesson needs the 7-argument award_xp (migration 20261017000000). Nothing changed.';
  end if;
  if to_regprocedure('public.complete_lesson(uuid,text,integer,integer,integer,integer,date,integer)') is not null then
    raise exception 'complete_lesson already exists (already migrated?). Nothing changed.';
  end if;
end
$$;

create function public.complete_lesson(
  p_user uuid,
  p_lesson text,
  p_xp_first integer,
  p_xp_repeat integer,
  p_score integer,
  p_streak integer,
  p_today date,
  p_replay_hours integer
)
returns table (total_xp integer, streak_days integer, awarded boolean, paid integer, first_completion boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_first boolean;
  v_award record;
begin
  if p_user is null or p_today is null or p_streak is null then
    raise exception 'complete_lesson: missing argument';
  end if;
  if p_lesson is null or length(p_lesson) = 0 or length(p_lesson) > 200 then
    raise exception 'complete_lesson: invalid lesson id';
  end if;
  if p_score is null or p_score < 0 or p_score > 100 then
    raise exception 'complete_lesson: score out of range (%)', p_score;
  end if;
  if p_xp_first is null or p_xp_first < 0 or p_xp_first > 500 or p_xp_repeat is null or p_xp_repeat < 0 or p_xp_repeat > 500 then
    raise exception 'complete_lesson: amount out of range';
  end if;
  if p_replay_hours is null or p_replay_hours < 0 or p_replay_hours > 24 * 31 then
    raise exception 'complete_lesson: replay window out of range (%)', p_replay_hours;
  end if;

  -- same key as award_xp's own lock: the same transaction can take it twice, other transactions queue here
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':lesson:' || p_lesson, 0));

  v_first := not exists (select 1 from public.lesson_progress lp where lp.user_id = p_user and lp.lesson_id = p_lesson);

  select a.total_xp, a.streak_days, a.awarded, a.paid
    into v_award
    from public.award_xp(p_user, case when v_first then p_xp_first else p_xp_repeat end, 'lesson', p_lesson, p_streak, p_today, p_replay_hours) a;
  if not found then
    -- no profile row: award_xp changed nothing visible; raising rolls back its ledger event too
    raise exception 'complete_lesson: no profile for this learner';
  end if;

  insert into public.lesson_progress as lp (user_id, lesson_id, best_score, attempts, xp_earned)
  values (p_user, p_lesson, p_score, 1, v_award.paid)
  on conflict (user_id, lesson_id) do update
     set best_score = greatest(lp.best_score, excluded.best_score),
         attempts = lp.attempts + 1,
         xp_earned = lp.xp_earned + excluded.xp_earned,
         last_completed_at = now();

  return query select v_award.total_xp, v_award.streak_days, v_award.awarded, v_award.paid, v_first;
end;
$$;

revoke execute on function public.complete_lesson(uuid, text, integer, integer, integer, integer, date, integer) from public, anon, authenticated;
grant execute on function public.complete_lesson(uuid, text, integer, integer, integer, integer, date, integer) to service_role;

-- Makes PostgREST (the API layer) pick up the new function immediately.
notify pgrst, 'reload schema';
