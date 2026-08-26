-- Recce schema.
--
-- Two concerns live here: the bento content the nav tabs switch between, and
-- the club signups the hero form collects. They share no keys — they are just
-- the two things this app persists.

create table if not exists sections (
  id       serial primary key,
  slug     text    not null unique,
  label    text    not null,
  position int     not null,
  -- `home` is the set the page opens on and has no tab of its own, so the nav
  -- is a filtered view of this table rather than a hardcoded list.
  in_nav   boolean not null default true
);

create table if not exists panels (
  id         serial primary key,
  section_id int  not null references sections(id) on delete cascade,
  -- Which of the four rows, and which side of it. The COLUMN RATIOS are not
  -- here: those are layout (and differ per row by design), and belong with the
  -- CSS that draws them, not with the copy.
  row_index  int  not null check (row_index between 1 and 4),
  side       text not null check (side in ('left', 'right')),
  kind       text not null check (kind in ('photo', 'text')),

  -- text panels
  icon_key   text,
  title      text,
  body_lines text[],

  -- photo panels. A KEY, not a URL: the frontend bundles and content-hashes
  -- its own images, so the database has no stable path to store. It stores
  -- which picture, and the client resolves it.
  photo_key  text,
  alt        text,

  constraint panels_one_per_slot unique (section_id, row_index, side),

  -- The two kinds have genuinely different required fields, so the shape is
  -- enforced here rather than trusted from the seed script.
  constraint panels_shape check (
    (kind = 'text'
       and title is not null and icon_key is not null and body_lines is not null
       and photo_key is null)
    or
    (kind = 'photo'
       and photo_key is not null and alt is not null
       and title is null and icon_key is null)
  )
);

create index if not exists panels_section_idx on panels (section_id, row_index, side);

create table if not exists members (
  id             serial      primary key,
  name           text        not null check (length(btrim(name)) > 0),
  email          text        not null check (position('@' in email) > 1),
  favourite_film text,
  created_at     timestamptz not null default now()
);

-- Case-insensitive uniqueness without needing the citext extension. The API
-- also checks, but this is what actually guarantees it under concurrency.
create unique index if not exists members_email_lower_idx on members (lower(email));
