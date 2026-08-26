# Recce

A film-club landing page in early-2000s Mac OS X Aqua, backed by a small
Express + Postgres API.

```
recce/
├── frontend/    Vite + React. The page.
└── backend/     Express 5 + node-postgres. The API.
```

## Running it

Postgres must be running locally. Then, once:

```bash
npm install
createdb recce                 # skip if it exists
cp backend/.env.example backend/.env   # edit if your Postgres needs a user/password
npm run db:reset -w recce-backend      # create tables and seed the four bento sets
```

And to work on it:

```bash
npm run dev        # API on :3001 and the page on :5173, together
npm run db:view    # print every table's contents
npm run db:prune   # delete every member but the newest (--dry to preview)
```

### Browsing it in a GUI

TablePlus is installed. New connection → PostgreSQL:

| | |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| User | `akashsubramanian` |
| Password | *(none — local Homebrew Postgres trusts your macOS user)* |
| Database | `recce` |

The dev server proxies `/api` to the backend, so the browser only ever talks to
one origin.

## What the backend holds

| table      | what it is |
|------------|-----------|
| `sections` | the nav tabs. `home` is the set the page opens on and has `in_nav = false`, so the nav is a filtered view of this table rather than a hardcoded list. |
| `panels`   | eight cells per section — four rows, a left and a right. Column ratios are *not* here: those are layout and live in the CSS. |
| `members`  | join-form signups: name, email, mobile, age, and the film that made them fall in love with cinema. All five required. Unique on `lower(email)`. |

Photos are stored as **keys** (`screen`, `audience`, …), not URLs — Vite
content-hashes the image files at build time, so there is no stable path for
the database to hold. `frontend/src/registry.js` is the one place keys are
resolved to bundled assets.

### Endpoints

| | |
|---|---|
| `GET /api/health` | liveness, including a database ping |
| `GET /api/sections` | the nav tabs, in order |
| `GET /api/sections/:slug/panels` | one section's eight cells, grouped into rows |
| `POST /api/members` | join. `422` with per-field errors, `409` if the email is already in |
| `GET /api/members/count` | how many have joined (never the list itself) |

## The one rule the layout obeys

**The page never scrolls, at any viewport.** Everything is sized in `vh`, and
that constraint is why the mosaic hides itself behind the join form on a phone —
the form, four feature rows and the meta row cannot all fit 844px, and of the
three the mosaic is context rather than task. Desktop shows both.

Changing anything about spacing means re-checking that rule at 1920, 1440, 1280,
1024, 768, 430, 390 and 360.
