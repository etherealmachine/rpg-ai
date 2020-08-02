-- name: CreateCharacter :one
INSERT INTO characters (owner_id, name, definition) VALUES ($1, $2, $3) RETURNING *;

-- name: DeleteCharacter :exec
DELETE FROM characters WHERE id = $1 AND owner_id = $2;

-- name: UpdateCharacter :exec
UPDATE characters SET
  name = $3
WHERE characters.id = $1 AND
EXISTS (SELECT true FROM characters WHERE characters.id = $1 AND characters.owner_id = $2);

-- name: SearchCharacters :many
SELECT * FROM characters WHERE name ilike $1;

-- name: ListCharactersByOwnerID :many
SELECT * FROM characters WHERE owner_id = $1;

-- name: GetCharacterByID :one
SELECT * from characters WHERE id = $1;