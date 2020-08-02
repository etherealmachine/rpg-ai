-- name: CreateCampaign :one
INSERT INTO campaigns (owner_id, name, description) VALUES ($1, $2, $3) RETURNING *;

-- name: DeleteCampaign :exec
DELETE FROM campaigns WHERE id = $1 AND owner_id = $2;

-- name: ListCampaignsByOwnerID :many
SELECT * FROM campaigns WHERE owner_id = $1;

-- name: GetOwnedCampaignByID :one
SELECT * FROM campaigns WHERE id = $1 AND owner_id = $2;

-- name: UpdateCampaign :exec
UPDATE campaigns SET
  name = COALESCE($3, name),
  description = COALESCE($4, description)
WHERE id = $1 AND owner_id = $2;

-- name: ListEncountersForCampaign :many
SELECT * FROM encounters WHERE campaign_id = $1;