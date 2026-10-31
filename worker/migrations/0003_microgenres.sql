-- Which microgenres each title belongs to ("|folk-horror|gore|"), so saved lists can be filtered by
-- microgenre and title pages can link to them. "|" = checked, none matched; NULL = not checked yet.
ALTER TABLE titles ADD COLUMN mg TEXT;
CREATE INDEX IF NOT EXISTS tmdb_map_imdb ON tmdb_map (imdb);
