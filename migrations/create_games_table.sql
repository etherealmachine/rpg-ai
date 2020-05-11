CREATE TABLE games
(
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX index_games_on_owner_id on games(owner_id);

CREATE TABLE game_players
(
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
);