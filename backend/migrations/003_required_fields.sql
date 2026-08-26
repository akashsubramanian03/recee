-- Favourite film is gone from the form, and everything that remains is
-- required: name, email, mobile, age, and the film that made you fall in love
-- with cinema.

alter table members drop column if exists favourite_film;

-- Enforced as NOT VALID rather than NOT NULL.
--
-- The rows already in the table predate mobile, age and first_love_film, so
-- they hold NULLs. NOT NULL would refuse to apply against them, and the only
-- ways round that are deleting real rows or backfilling them with invented
-- values — neither of which a migration should do on its own.
--
-- NOT VALID enforces the constraint on every INSERT and UPDATE from now on
-- while leaving the existing rows alone. Once they are cleaned up, each
-- constraint can be promoted with:
--     alter table members validate constraint <name>;

alter table members drop constraint if exists members_mobile_required;
alter table members add  constraint members_mobile_required
  check (mobile is not null and length(btrim(mobile)) between 7 and 24) not valid;

alter table members drop constraint if exists members_age_required;
alter table members add  constraint members_age_required
  check (age is not null and age between 13 and 120) not valid;

alter table members drop constraint if exists members_first_love_required;
alter table members add  constraint members_first_love_required
  check (first_love_film is not null and length(btrim(first_love_film)) > 0) not valid;

-- Superseded by the *_required constraints above, which say the same thing and
-- more.
alter table members drop constraint if exists members_mobile_len;
alter table members drop constraint if exists members_age_range;
