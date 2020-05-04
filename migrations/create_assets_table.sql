CREATE TABLE assets
(
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(100) NOT NULL,
  filename VARCHAR(200) NOT NULL,
  filedata BYTEA NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE asset_references
(
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  referenced_asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX index_assets_on_owner_id on assets(owner_id);