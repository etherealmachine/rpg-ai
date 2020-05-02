-- name: GetAssetsByOwnerID :many
SELECT * FROM assets WHERE owner_id = $1;