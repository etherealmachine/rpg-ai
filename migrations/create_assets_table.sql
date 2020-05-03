CREATE TABLE assets
(
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(100) NOT NULL,
  filename VARCHAR(200) NOT NULL,
  filedata BYTEA NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX index_assets_on_owner_id on assets(owner_id);