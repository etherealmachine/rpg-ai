-- name: CreateAsset :one
INSERT INTO assets (owner_id, content_type, filename, filedata) VALUES ($1, $2, $3, $4) RETURNING *;
SELECT * FROM assets WHERE owner_id = $1;

-- name: ListAssetMetadataByOwnerID :many
SELECT id, owner_id, created_at, filename, content_type, octet_length(filedata) as size FROM assets WHERE owner_id = $1;

-- name: DeleteAssetWithOwner :exec
DELETE FROM assets WHERE id = $1 AND owner_id = $2;