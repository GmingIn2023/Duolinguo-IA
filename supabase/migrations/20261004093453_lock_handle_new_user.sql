-- This version exists in the remote project's migration history (applied 2026-10-04), but its file was never committed.
-- It is reproduced here so that the local and remote histories list the same versions.
--
-- What is known: a read-only look at the remote history on 2026-10-17 showed one statement, starting with
-- "revoke execute on function public.handle_new_user() from pub…" (only its first 60 characters were read).
-- The repository already contains that statement (20261004093428_init_gusgus.sql, and the refonte migration),
-- so it is repeated below. Revoking again changes nothing: it is idempotent.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
