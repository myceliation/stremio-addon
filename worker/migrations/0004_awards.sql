-- Festival and award lists that keep themselves current: a scheduled job re-reads one Wikipedia page an hour
-- and adds the newly announced winners and nominees (award_items); award_seen remembers what was already looked up
CREATE TABLE IF NOT EXISTS award_items (list TEXT NOT NULL, id TEXT NOT NULL, name TEXT, year INTEGER, added INTEGER, PRIMARY KEY (list, id));
CREATE TABLE IF NOT EXISTS award_seen (list TEXT NOT NULL, title TEXT NOT NULL, year INTEGER NOT NULL, id TEXT, PRIMARY KEY (list, title, year));
CREATE TABLE IF NOT EXISTS award_state (page TEXT PRIMARY KEY, checked INTEGER);
