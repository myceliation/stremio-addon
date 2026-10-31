-- Mycelium schema (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS users (
  uid       TEXT PRIMARY KEY,
  token     TEXT NOT NULL UNIQUE,
  share     TEXT NOT NULL UNIQUE,
  settings  TEXT NOT NULL,              -- JSON
  auth_enc  TEXT,                       -- optional, AES-GCM sealed Stremio key (history rows)
  hist_at   INTEGER DEFAULT 0,
  created   INTEGER NOT NULL
) WITHOUT ROWID;

-- Title metadata shared by everyone (filled from TMDB / Cinemeta / imports)
CREATE TABLE IF NOT EXISTS titles (
  id      TEXT PRIMARY KEY,             -- tt…
  type    TEXT NOT NULL,                -- movie | series
  name    TEXT NOT NULL,
  year    TEXT,
  poster  TEXT,
  genres  TEXT,                         -- "|Horror|Comedy|"
  lang    TEXT,
  vote    REAL,
  updated INTEGER
) WITHOUT ROWID;

-- Every membership: list = 'library' | 'watched' | shelf name | 'l:<listId>'
CREATE TABLE IF NOT EXISTS items (
  uid    TEXT NOT NULL,
  list   TEXT NOT NULL,
  id     TEXT NOT NULL,
  type   TEXT NOT NULL,
  added  INTEGER NOT NULL,
  PRIMARY KEY (uid, list, id)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS items_by_added ON items (uid, list, type, added);

-- Named lists the user creates ("put this scrape into …")
CREATE TABLE IF NOT EXISTS lists (
  uid     TEXT NOT NULL,
  lid     TEXT NOT NULL,
  name    TEXT NOT NULL,
  row     INTEGER NOT NULL DEFAULT 1,   -- show as a row in Stremio
  created INTEGER NOT NULL,
  PRIMARY KEY (uid, lid)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS ratings (
  uid    TEXT NOT NULL,
  id     TEXT NOT NULL,
  type   TEXT NOT NULL,
  stars  INTEGER NOT NULL,
  review TEXT,
  rated  INTEGER NOT NULL,
  PRIMARY KEY (uid, id)
) WITHOUT ROWID;

-- Mirror of the user's Stremio library (only when history is connected)
CREATE TABLE IF NOT EXISTS history (
  uid    TEXT NOT NULL,
  id     TEXT NOT NULL,
  type   TEXT NOT NULL,
  name   TEXT,
  poster TEXT,
  status TEXT NOT NULL,                 -- watched | progress | opened
  last   TEXT,
  times  INTEGER DEFAULT 0,
  pct    INTEGER DEFAULT 0,
  mtime  TEXT,
  PRIMARY KEY (uid, id)
) WITHOUT ROWID;

-- List-scrape jobs, stepped by the import page so each request stays small
CREATE TABLE IF NOT EXISTS jobs (
  id       TEXT PRIMARY KEY,
  uid      TEXT NOT NULL,
  source   TEXT NOT NULL,
  target   TEXT NOT NULL,
  phase    TEXT NOT NULL,               -- collect | resolve | ready | done | error
  state    TEXT NOT NULL,               -- JSON: {queue, pos, results, collect, msg}
  created  INTEGER NOT NULL
) WITHOUT ROWID;

-- One row per thing to resolve in a scrape job
CREATE TABLE IF NOT EXISTS job_rows (
  job    TEXT NOT NULL,
  idx    INTEGER NOT NULL,
  kind   TEXT NOT NULL,                 -- title | id | tmdb | lb | wiki
  input  TEXT NOT NULL,                 -- what the user's list said
  ref    TEXT,                          -- year, tmdb id+type, slug, article title…
  stars  REAL,                          -- rating carried by the source (CSV), if any
  status INTEGER NOT NULL DEFAULT 0,    -- 0 pending, 1 found, 2 not found
  id     TEXT, type TEXT, name TEXT, year TEXT, poster TEXT, genres TEXT, conf INTEGER,
  PRIMARY KEY (job, idx)
) WITHOUT ROWID;
