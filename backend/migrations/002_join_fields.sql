-- The join form grew from three fields to six.
--
-- A separate file rather than an edit to 001: 001 has already been applied to
-- real databases, and rewriting an applied migration means the schema you get
-- depends on whether you ran it before or after the edit. Additive and
-- idempotent, so it is safe on a fresh database and an existing one alike.

alter table members add column if not exists mobile          text;
alter table members add column if not exists age             int;
alter table members add column if not exists first_love_film text;

-- Loose on purpose. Numbers arrive with +, spaces, dashes and brackets, and a
-- strict format here would reject valid numbers from half the world; the API
-- checks shape and this only catches nonsense.
alter table members drop constraint if exists members_mobile_len;
alter table members add  constraint members_mobile_len
  check (mobile is null or length(btrim(mobile)) between 7 and 24);

-- 13 is the floor most services use for self-signup; the ceiling is only there
-- to reject typos like a year entered instead of an age.
alter table members drop constraint if exists members_age_range;
alter table members add  constraint members_age_range
  check (age is null or age between 13 and 120);
