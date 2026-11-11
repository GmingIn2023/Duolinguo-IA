-- A learner can update their own display_name through the API (column grant in 20261004145345). The signup trigger already
-- cuts it to 80 characters, but a direct update had no limit: a megabyte-long name would be stored and rendered on every page.
--
-- NOT VALID: the rule applies to every new insert and update, existing rows are left as they are and not scanned.
-- Nothing in the application depends on this migration: the code works the same before and after it.

alter table public.profiles
  add constraint profiles_display_name_length
  check (display_name is null or char_length(display_name) <= 80) not valid;
