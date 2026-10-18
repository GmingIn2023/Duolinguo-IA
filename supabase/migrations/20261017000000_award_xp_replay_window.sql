-- award_xp enforces the replay window itself, atomically.
--
-- Before: the server read the ledger ("was this lesson paid in the last 20 h?"), then called award_xp.
-- Two requests sent at the same time could both read "no", and both be paid.
-- Now: award_xp takes the window as a parameter, serialises concurrent calls for the same
-- (user, source, ref) with a transaction-scoped advisory lock, and decides inside the same transaction.
--
-- The ledger event is still written when the window refuses the XP (amount 0): it keeps the streak
-- and the "attempted" trace, like before. A second return column says how much XP was really paid.
--
-- Apply BEFORE deploying the server code that passes p_replay_hours (the call fails on the old function).
-- The old 6-argument function is dropped on purpose: keeping both would make the call ambiguous.

drop function if exists public.award_xp(uuid, integer, text, text, integer, date);

create function public.award_xp(
  p_user uuid,
  p_amount integer,
  p_source text,
  p_ref text,
  p_streak integer,
  p_today date,
  p_replay_hours integer default 0
)
returns table (total_xp integer, streak_days integer, awarded boolean, paid integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_amount integer := p_amount;
begin
  if p_amount < 0 or p_amount > 500 then
    raise exception 'award_xp: amount out of range (%)', p_amount;
  end if;
  if p_replay_hours < 0 or p_replay_hours > 24 * 31 then
    raise exception 'award_xp: replay window out of range (%)', p_replay_hours;
  end if;

  if p_replay_hours > 0 and p_amount > 0 then
    -- concurrent calls for the same learner, source and ref queue here and see each other's committed event
    perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_source || ':' || p_ref, 0));
    if exists (
      select 1
        from public.xp_events e
       where e.user_id = p_user
         and e.source = p_source
         and e.ref = p_ref
         and e.amount > 0
         and e.created_at >= now() - make_interval(hours => p_replay_hours)
    ) then
      v_amount := 0;
    end if;
  end if;

  insert into public.xp_events (user_id, amount, source, ref)
  values (p_user, v_amount, p_source, p_ref)
  on conflict do nothing;

  if not found then
    -- a one-off bonus (weekly, checkpoint) already claimed: nothing changes
    return query select p.xp, p.streak_days, false, 0 from public.profiles p where p.id = p_user;
    return;
  end if;

  return query
    update public.profiles p
       set xp = p.xp + v_amount,
           streak_days = p_streak,
           last_active_date = p_today,
           updated_at = now()
     where p.id = p_user
    returning p.xp, p.streak_days, true, v_amount;
end;
$$;

revoke execute on function public.award_xp(uuid, integer, text, text, integer, date, integer) from public, anon, authenticated;
grant execute on function public.award_xp(uuid, integer, text, text, integer, date, integer) to service_role;

-- Makes PostgREST (the API layer) pick up the new function signature immediately.
notify pgrst, 'reload schema';
