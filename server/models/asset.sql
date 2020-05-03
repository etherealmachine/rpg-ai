-- name: CreateAsset :one
INSERT INTO assets (owner_id, content_type, filename, filedata) VALUES ($1, $2, $3, $4) RETURNING *;
SELECT * FROM assets WHERE owner_id = $1;

-- name: GetAssetsByOwnerID :many
SELECT * FROM assets WHERE owner_id = $1;