-- name: CreateAsset :one
INSERT INTO assets (owner_id, content_type, filename, filedata) VALUES ($1, $2, $3, $4) RETURNING *;
SELECT * FROM assets WHERE owner_id = $1;

-- name: ListAssetMetadataByOwnerID :many
SELECT owner_id, created_at, filename, content_type, octet_length(filedata) as size FROM assets WHERE owner_id = $1;