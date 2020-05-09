CREATE TABLE thumbnails
(
  id SERIAL PRIMARY KEY,
  tilemap_id INTEGER REFERENCES tilemaps(id) ON DELETE CASCADE,
  spritesheet_id INTEGER REFERENCES spritesheets(id) ON DELETE CASCADE,
  image BYTEA NOT NULL,
  hash BYTEA NOT NULL,
  content_type TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK(
    (
      (tilemap_id is not null)::integer +
      (spritesheet_id is not null)::integer
    ) = 1
  )
);

CREATE INDEX index_thumbnails_on_hash on thumbnails(hash);

CREATE OR REPLACE FUNCTION hash_update_thumbnail_tg() RETURNS trigger AS $$
BEGIN
  IF tg_op = 'INSERT' OR tg_op = 'UPDATE' THEN
    NEW.hash = digest(NEW.image, 'sha256');
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thumbnail_hash_update 
BEFORE INSERT OR UPDATE ON thumbnails
FOR EACH ROW EXECUTE PROCEDURE hash_update_thumbnail_tg();