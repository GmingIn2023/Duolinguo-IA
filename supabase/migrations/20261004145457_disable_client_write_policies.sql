-- The client write policies are inert since 20261004145345 revoked the table grants.
-- Pin them to false as well, so re-granting a privilege by mistake still lets nothing through.
-- (They can be dropped from the dashboard; kept here because DROP needs manual confirmation.)
alter policy "own profile insert" on public.profiles with check (false);
alter policy "own progress write" on public.lesson_progress with check (false);
alter policy "own progress update" on public.lesson_progress using (false) with check (false);
alter policy "own reviews write" on public.review_items with check (false);
alter policy "own reviews update" on public.review_items using (false) with check (false);
alter policy "own xp write" on public.xp_events with check (false);
