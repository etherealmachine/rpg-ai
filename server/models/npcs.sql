-- name: CreateNPC :one
INSERT INTO npcs (owner_id, name, definition) VALUES ($1, $2, $3) RETURNING *;

-- name: DeleteNPC :exec
DELETE FROM npcs WHERE id = $1 AND owner_id = $2;

-- name: UpdateNPC :exec
UPDATE npcs SET
  name = $3,
  definition = $4,
  sprite = $5
WHERE npcs.id = $1 AND
EXISTS (SELECT true FROM npcs WHERE npcs.id = $1 AND npcs.owner_id = $2);

-- name: SearchNPCs :many
SELECT * FROM npcs WHERE name ilike $1;

-- name: GetNPCByID :one
SELECT * from npcs WHERE id = $1;

CREATE OR REPLACE FUNCTION hash_update_npc_tg() RETURNS trigger AS $$
BEGIN
  IF tg_op = 'INSERT' OR tg_op = 'UPDATE' THEN
    NEW.hash = digest(NEW.definition::text, 'sha256') || digest(NEW.image, 'sha256');
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER npc_hash_update 
BEFORE INSERT OR UPDATE ON npcs
FOR EACH ROW EXECUTE PROCEDURE hash_update_npc_tg();