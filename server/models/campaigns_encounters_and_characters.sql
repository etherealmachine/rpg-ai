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

-- name: CreateEncounter :one
INSERT INTO encounters (campaign_id, name, description, tilemap_id)
SELECT $1, $2, $3, $4
FROM campaigns
WHERE
  EXISTS (SELECT true FROM campaigns WHERE id = $1 AND campaigns.owner_id = $5)
  AND (EXISTS (SELECT true FROM tilemaps WHERE id = $4 AND tilemaps.owner_id = $5) OR $4 IS NULL)
RETURNING *;

-- name: DeleteEncounter :exec
DELETE FROM encounters
WHERE encounters.id = $1 AND
EXISTS (SELECT true FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2);

-- name: ListEncountersForCampaign :many
SELECT * FROM encounters WHERE campaign_id = $1;

-- name: UpdateEncounter :exec
UPDATE encounters SET
  name = $3,
  description = COALESCE($4, description),
  tilemap_id = COALESCE($5, tilemap_id)
WHERE encounters.id = $1 AND
EXISTS (SELECT true FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2);

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

-- name: ListCharactersForEncounter :many
SELECT characters.* FROM encounter_characters
JOIN characters ON characters.id = character_id
WHERE encounter_id = $1;

-- name: AddCharacterToEncounter :exec
INSERT INTO encounter_characters (encounter_id, character_id)
SELECT $1, $2
FROM campaigns
WHERE EXISTS (SELECT true FROM encounters JOIN campaigns ON campaigns.id = encounters.campaign_id AND campaigns.owner_id = $3 WHERE encounters.id = $1);

-- name: RemoveCharacterFromEncounter :exec
DELETE FROM encounter_characters
WHERE encounter_characters.encounter_id = $1 AND encounter_characters.character_id = $2
AND EXISTS (SELECT true FROM encounters JOIN campaigns ON campaigns.id = encounters.campaign_id AND campaigns.owner_id = $3 WHERE encounters.id = $1);