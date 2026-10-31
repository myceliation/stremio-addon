-- TMDB id → IMDb id, looked up in one query per page instead of one cache read per title
CREATE TABLE IF NOT EXISTS tmdb_map (
  k    TEXT PRIMARY KEY,      -- "movie:123" | "tv:456"
  imdb TEXT NOT NULL          -- "" when TMDB has no IMDb id
) WITHOUT ROWID;
