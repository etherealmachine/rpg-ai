-- name: CreateCampaign :one
INSERT INTO campaigns (owner_id, name, description) VALUES ($1, $2, $3) RETURNING *;

-- name: DeleteCampaign :exec
DELETE FROM campaigns WHERE id = $1 AND owner_id = $2;

-- name: ListCampaignsByOwnerID :many
SELECT * FROM campaigns WHERE owner_id = $1;

-- name: UpdateCampaignName :exec
UPDATE campaigns SET name = $3 WHERE id = $1 AND owner_id = $2;

-- name: UpdateCampaignDescription :exec
UPDATE campaigns SET description = $3 WHERE id = $1 AND owner_id = $2;

-- name: CreateEncounter :one
INSERT INTO encounters (campaign_id, name) VALUES ($1, $2) RETURNING *;

-- name: DeleteEncounter :exec
DELETE FROM encounters
WHERE encounters.id = $1 AND
EXISTS (SELECT id FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2);

-- name: ListEncountersForCampaign :many
SELECT * FROM campaigns WHERE id = $1;

-- name: UpdateEncounterName :exec
UPDATE encounters SET name = $3 WHERE encounters.id = $1 AND
EXISTS (SELECT id FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2);

-- name: UpdateEncounterDescription :exec
UPDATE encounters SET description = $3 WHERE encounters.id = $1 AND
EXISTS (SELECT id FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2);

-- name: UpdateEncounterTilemap :exec
UPDATE encounters SET tilemap_id = $3 WHERE encounters.id = $1 AND
EXISTS (SELECT id FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2);

-- name: CreateCharacter :one
INSERT INTO characters (owner_id, name) VALUES ($1, $2) RETURNING *;

-- name: DeleteCharacter :exec
DELETE FROM characters WHERE id = $1 AND owner_id = $2;

-- name: ListCharactersByOwnerID :many
SELECT * FROM characters WHERE owner_id = $1;

-- name: UpdateCharacterName :exec
UPDATE characters SET name = $3 WHERE id = $1 AND owner_id = $2;

-- name: UpdateCharacterDefinition :exec
UPDATE characters SET definition = $3 WHERE id = $1 AND owner_id = $2;

-- name: UpdateCharacterSprite :exec
UPDATE characters SET sprite = $3 WHERE id = $1 AND owner_id = $2;