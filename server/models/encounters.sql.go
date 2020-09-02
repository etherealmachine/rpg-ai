// Code generated by sqlc. DO NOT EDIT.
// source: encounters.sql

package models

import (
	"context"
	"database/sql"
)

const addCharacterToEncounter = `-- name: AddCharacterToEncounter :exec
INSERT INTO encounter_characters (encounter_id, character_id)
SELECT $1, $2
FROM campaigns
WHERE EXISTS (SELECT true FROM encounters JOIN campaigns ON campaigns.id = encounters.campaign_id AND campaigns.owner_id = $3 WHERE encounters.id = $1)
`

type AddCharacterToEncounterParams struct {
	EncounterID int32
	CharacterID int32
	OwnerID     int32
}

func (q *Queries) AddCharacterToEncounter(ctx context.Context, arg AddCharacterToEncounterParams) error {
	_, err := q.db.ExecContext(ctx, addCharacterToEncounter, arg.EncounterID, arg.CharacterID, arg.OwnerID)
	return err
}

const createEncounter = `-- name: CreateEncounter :one
INSERT INTO encounters (campaign_id, name, description, tilemap_id)
SELECT $1, $2, $3, $4
FROM campaigns
WHERE
  EXISTS (SELECT true FROM campaigns WHERE id = $1 AND campaigns.owner_id = $5)
  AND (EXISTS (SELECT true FROM tilemaps WHERE id = $4 AND tilemaps.owner_id = $5) OR $4 IS NULL)
RETURNING id, campaign_id, name, description, tilemap_id, created_at
`

type CreateEncounterParams struct {
	CampaignID  int32
	Name        string
	Description sql.NullString
	TilemapID   sql.NullInt32
	OwnerID     int32
}

func (q *Queries) CreateEncounter(ctx context.Context, arg CreateEncounterParams) (Encounter, error) {
	row := q.db.QueryRowContext(ctx, createEncounter,
		arg.CampaignID,
		arg.Name,
		arg.Description,
		arg.TilemapID,
		arg.OwnerID,
	)
	var i Encounter
	err := row.Scan(
		&i.ID,
		&i.CampaignID,
		&i.Name,
		&i.Description,
		&i.TilemapID,
		&i.CreatedAt,
	)
	return i, err
}

const deleteEncounter = `-- name: DeleteEncounter :exec
DELETE FROM encounters
WHERE encounters.id = $1 AND
EXISTS (SELECT true FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2)
`

type DeleteEncounterParams struct {
	ID      int32
	OwnerID int32
}

func (q *Queries) DeleteEncounter(ctx context.Context, arg DeleteEncounterParams) error {
	_, err := q.db.ExecContext(ctx, deleteEncounter, arg.ID, arg.OwnerID)
	return err
}

const getEncounterForCharacter = `-- name: GetEncounterForCharacter :one
SELECT id, campaign_id, name, description, tilemap_id, created_at FROM encounters
WHERE encounters.id = $1
AND EXISTS (
  SELECT true
  FROM encounter_characters
  JOIN characters ON characters.id = encounter_characters.character_id AND characters.owner_id = $3
  WHERE encounter_id = $1 AND character_id = $2)
`

type GetEncounterForCharacterParams struct {
	ID          int32
	CharacterID int32
	OwnerID     int32
}

func (q *Queries) GetEncounterForCharacter(ctx context.Context, arg GetEncounterForCharacterParams) (Encounter, error) {
	row := q.db.QueryRowContext(ctx, getEncounterForCharacter, arg.ID, arg.CharacterID, arg.OwnerID)
	var i Encounter
	err := row.Scan(
		&i.ID,
		&i.CampaignID,
		&i.Name,
		&i.Description,
		&i.TilemapID,
		&i.CreatedAt,
	)
	return i, err
}

const listCharactersForEncounter = `-- name: ListCharactersForEncounter :many
SELECT characters.id, characters.owner_id, characters.name, characters.definition, characters.sprite, characters.created_at FROM encounter_characters
JOIN characters ON characters.id = character_id
WHERE encounter_id = $1
`

func (q *Queries) ListCharactersForEncounter(ctx context.Context, encounterID int32) ([]Character, error) {
	rows, err := q.db.QueryContext(ctx, listCharactersForEncounter, encounterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Character
	for rows.Next() {
		var i Character
		if err := rows.Scan(
			&i.ID,
			&i.OwnerID,
			&i.Name,
			&i.Definition,
			&i.Sprite,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const removeCharacterFromEncounter = `-- name: RemoveCharacterFromEncounter :exec
DELETE FROM encounter_characters
WHERE encounter_characters.encounter_id = $1 AND encounter_characters.character_id = $2
AND EXISTS (SELECT true FROM encounters JOIN campaigns ON campaigns.id = encounters.campaign_id AND campaigns.owner_id = $3 WHERE encounters.id = $1)
`

type RemoveCharacterFromEncounterParams struct {
	EncounterID int32
	CharacterID int32
	OwnerID     int32
}

func (q *Queries) RemoveCharacterFromEncounter(ctx context.Context, arg RemoveCharacterFromEncounterParams) error {
	_, err := q.db.ExecContext(ctx, removeCharacterFromEncounter, arg.EncounterID, arg.CharacterID, arg.OwnerID)
	return err
}

const updateEncounter = `-- name: UpdateEncounter :exec
UPDATE encounters SET
  name = $3,
  description = COALESCE($4, description),
  tilemap_id = COALESCE($5, tilemap_id)
WHERE encounters.id = $1 AND
EXISTS (SELECT true FROM campaigns WHERE campaigns.id = encounters.campaign_id AND owner_id = $2)
`

type UpdateEncounterParams struct {
	ID          int32
	OwnerID     int32
	Name        string
	Description sql.NullString
	TilemapID   sql.NullInt32
}

func (q *Queries) UpdateEncounter(ctx context.Context, arg UpdateEncounterParams) error {
	_, err := q.db.ExecContext(ctx, updateEncounter,
		arg.ID,
		arg.OwnerID,
		arg.Name,
		arg.Description,
		arg.TilemapID,
	)
	return err
}