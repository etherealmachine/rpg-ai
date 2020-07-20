-- name: CreateSpritesheet :one
INSERT INTO spritesheets (owner_id, name, definition, image) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: CreateTilemap :one
INSERT INTO tilemaps (owner_id, name, definition) VALUES ($1, $2, $3) RETURNING *;

-- name: ListSpritesheetsByOwnerID :many
SELECT id, created_at, name, description, hash FROM spritesheets WHERE owner_id = $1;

-- name: ListTilemapsByOwnerID :many
SELECT id, created_at, name, description, hash FROM tilemaps WHERE owner_id = $1;

-- name: DeleteSpritesheet :exec
DELETE FROM spritesheets WHERE id = $1 AND owner_id = $2;

-- name: DeleteTilemap :exec
DELETE FROM tilemaps WHERE id = $1 AND owner_id = $2;

-- name: GetSpritesheetByHash :one
SELECT * FROM spritesheets WHERE hash = $1;

-- name: GetTilemapByID :one
SELECT * FROM tilemaps WHERE id = $1;

-- name: GetTilemapByHash :one
SELECT * FROM tilemaps WHERE hash = $1;

-- name: CreateTilemapReference :exec
INSERT INTO tilemap_references (tilemap_id, spritesheet_id) VALUES ($1, $2);

-- name: ListSpritesheetsForTilemap :many
SELECT tilemap_id, spritesheet_id, s.name AS spritesheet_name, s.hash as spritesheet_hash FROM tilemap_references r JOIN spritesheets s ON s.id = r.spritesheet_id WHERE tilemap_id = $1;

-- name: ListThumbnailsForTilemaps :many
SELECT tilemap_id, hash FROM thumbnails WHERE tilemap_id = ANY($1::INTEGER[]);

-- name: ListThumbnailsForSpritesheets :many
SELECT spritesheet_id, hash FROM thumbnails WHERE spritesheet_id = ANY($1::INTEGER[]);

-- name: InsertTilemapThumbnail :execrows
WITH owned_tilemap AS (
  SELECT id FROM tilemaps WHERE owner_id = @owner_id AND id = @tilemap_id
)
INSERT INTO thumbnails (tilemap_id, content_type, image, width, height)
SELECT owned_tilemap.id, @content_type, @image, @width, @height FROM owned_tilemap
WHERE NOT EXISTS (SELECT id FROM thumbnails WHERE thumbnails.tilemap_id = @tilemap_id);

-- name: UpdateTilemapThumbnail :exec
WITH owned_tilemap AS (
  SELECT id FROM tilemaps WHERE owner_id = @owner_id AND tilemaps.id = @tilemap_id
)
UPDATE thumbnails SET content_type = @content_type, image = @image, width = @width, height = @height, created_at = NOW()
WHERE tilemap_id = (SELECT id FROM owned_tilemap);

-- name: GetThumbnailByHash :one
SELECT id, tilemap_id, spritesheet_id, content_type, image, width, height, created_at FROM thumbnails WHERE hash = $1;

-- name: ListRecentTilemaps :many
SELECT * FROM tilemaps ORDER BY created_at DESC LIMIT $1;

-- name: ListRecentSpritesheets :many
SELECT * FROM spritesheets ORDER BY created_at DESC LIMIT $1;