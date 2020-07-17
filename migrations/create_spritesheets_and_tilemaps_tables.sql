CREATE TABLE spritesheets
(
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  image BYTEA NOT NULL,
  hash BYTEA NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX index_spritesheets_on_owner_id on spritesheets(owner_id);
CREATE INDEX index_spritesheets_on_hash on spritesheets(hash);

CREATE TABLE tilemaps
(
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  hash BYTEA NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX index_tilemaps_on_owner_id on tilemaps(owner_id);
CREATE INDEX index_tilemaps_on_hash on tilemaps(hash);

CREATE TABLE tilemap_references
(
  id SERIAL PRIMARY KEY,
  tilemap_id INTEGER NOT NULL REFERENCES tilemaps(id) ON DELETE CASCADE,
  spritesheet_id INTEGER NOT NULL REFERENCES spritesheets(id) ON DELETE CASCADE
);

CREATE EXTENSION pgcrypto;

CREATE OR REPLACE FUNCTION hash_update_spritesheet_tg() RETURNS trigger AS $$
BEGIN
  IF tg_op = 'INSERT' OR tg_op = 'UPDATE' THEN
    NEW.hash = digest(NEW.definition::text, 'sha256') || digest(NEW.image, 'sha256');
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER spritesheet_hash_update 
BEFORE INSERT OR UPDATE ON spritesheets
FOR EACH ROW EXECUTE PROCEDURE hash_update_spritesheet_tg();

CREATE OR REPLACE FUNCTION hash_update_tilemap_tg() RETURNS trigger AS $$
BEGIN
  IF tg_op = 'INSERT' OR tg_op = 'UPDATE' THEN
    NEW.hash = digest(NEW.definition::text, 'sha256');
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tilemap_hash_update 
BEFORE INSERT OR UPDATE ON tilemaps
FOR EACH ROW EXECUTE PROCEDURE hash_update_tilemap_tg();