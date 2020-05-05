CREATE TABLE spritesheets
(
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  definition JSONB NOT NULL,
  image BYTEA NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX index_spritesheets_on_owner_id on spritesheets(owner_id);

CREATE TABLE tilemaps
(
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  definition JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX index_tilemaps_on_owner_id on tilemaps(owner_id);

CREATE TABLE tilemap_references
(
  id SERIAL PRIMARY KEY,
  tilemap_id INTEGER NOT NULL REFERENCES tilemaps(id) ON DELETE CASCADE,
  spritesheet_id INTEGER NOT NULL REFERENCES spritesheets(id) ON DELETE CASCADE
);