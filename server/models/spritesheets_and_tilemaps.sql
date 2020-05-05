-- name: CreateSpritesheet :one
INSERT INTO spritesheets (owner_id, name, definition, image) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: CreateTilemap :one
INSERT INTO tilemaps (owner_id, name, definition) VALUES ($1, $2, $3) RETURNING *;

-- name: ListSpritesheetsByOwnerID :many
SELECT id, created_at, name, octet_length(definition::text) as spritesheet_size, octet_length(image) as image_size FROM spritesheets WHERE owner_id = $1;

-- name: ListTilemapsByOwnerID :many
SELECT id, created_at, name, octet_length(definition::text) as tilemap_size FROM tilemaps WHERE owner_id = $1;

-- name: DeleteSpritesheetWithOwner :exec
DELETE FROM spritesheets WHERE id = $1 AND owner_id = $2;

-- name: DeleteTilemapWithOwner :exec
DELETE FROM tilemaps WHERE id = $1 AND owner_id = $2;

-- name: GetSpritesheetByID :one
SELECT * FROM spritesheets WHERE id = $1;

-- name: GetTilemapByID :one
SELECT * FROM tilemaps WHERE id = $1;

-- name: CreateTilemapReference :exec
INSERT INTO tilemap_references (tilemap_id, spritesheet_id) VALUES ($1, $2);

-- name: ListSpritesheetsForTilemap :many
SELECT tilemap_id, spritesheet_id, s.name as spritesheet_name FROM tilemap_references r JOIN spritesheets s ON s.id = r.spritesheet_id WHERE tilemap_id = $1;