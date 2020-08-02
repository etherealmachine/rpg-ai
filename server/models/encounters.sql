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

-- name: UpdateEncounter :exec
UPDATE encounters SET
  name = $3,
  description = COALESCE($4, description),
  tilemap_id = COALESCE($5, tilemap_id)
WHERE encounters.id = $1 AND
EXISTS (SELECT true FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2);

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

-- name: GetEncounterForCharacter :one
SELECT * FROM encounters
WHERE encounters.id = $1
AND EXISTS (
  SELECT true
  FROM encounter_characters
  JOIN characters ON characters.id = encounter_characters.character_id AND characters.owner_id = $3
  WHERE encounter_id = $1 AND character_id = $2);