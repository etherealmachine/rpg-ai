CREATE TABLE thumbnails
(
  id SERIAL PRIMARY KEY,
  tilemap_id INTEGER REFERENCES tilemaps(id) ON DELETE CASCADE,
  spritesheet_id INTEGER REFERENCES spritesheets(id) ON DELETE CASCADE,
  image BYTEA NOT NULL,
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