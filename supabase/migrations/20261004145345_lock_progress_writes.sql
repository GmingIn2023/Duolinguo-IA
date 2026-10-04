-- Progress and XP are server-authoritative.
-- Learners keep read access to their own rows (RLS), but every write to XP, streak,
-- lesson progress and spaced-repetition state goes through the server with the
-- secret key (service_role). The only profile fields a learner may change: name and track.

-- profiles: created by the handle_new_user trigger, never by the client
revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
grant update (display_name, track_id, updated_at) on public.profiles to authenticated;

-- lesson_progress: read-only for learners
revoke insert, update, delete, truncate on public.lesson_progress from anon, authenticated;

-- review_items: read-only for learners
revoke insert, update, delete, truncate on public.review_items from anon, authenticated;

-- xp_events: read-only for learners
revoke insert, update, delete, truncate on public.xp_events from anon, authenticated;

-- One weekly bonus per ISO week, enforced by the database
create unique index xp_events_weekly_once on public.xp_events (user_id, ref) where source = 'weekly';

-- Atomic XP credit: event + total + streak in one transaction, no read-modify-write race.
-- Returns awarded = false (and nothing changes) when the weekly bonus was already claimed.
create function public.award_xp(p_user uuid, p_amount integer, p_source text, p_ref text, p_streak integer, p_today date)
returns table (total_xp integer, streak_days integer, awarded boolean)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_amount < 0 or p_amount > 500 then
    raise exception 'award_xp: amount out of range (%)', p_amount;
  end if;

  insert into public.xp_events (user_id, amount, source, ref)
  values (p_user, p_amount, p_source, p_ref)
  on conflict do nothing;

  if not found then
    return query select p.xp, p.streak_days, false from public.profiles p where p.id = p_user;
    return;
  end if;

  return query
    update public.profiles p
       set xp = p.xp + p_amount,
           streak_days = p_streak,
           last_active_date = p_today,
           updated_at = now()
     where p.id = p_user
    returning p.xp, p.streak_days, true;
end;
$$;

revoke execute on function public.award_xp(uuid, integer, text, text, integer, date) from public, anon, authenticated;
grant execute on function public.award_xp(uuid, integer, text, text, integer, date) to service_role;
