// Code generated by sqlc. DO NOT EDIT.
// source: spritesheets_and_tilemaps.sql

package models

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/lib/pq"
)

const createSpritesheet = `-- name: CreateSpritesheet :one
INSERT INTO spritesheets (owner_id, name, definition, image) VALUES ($1, $2, $3, $4) RETURNING id, owner_id, name, definition, image, created_at
`

type CreateSpritesheetParams struct {
	OwnerID    int32
	Name       string
	Definition json.RawMessage
	Image      []byte
}

func (q *Queries) CreateSpritesheet(ctx context.Context, arg CreateSpritesheetParams) (Spritesheet, error) {
	row := q.db.QueryRowContext(ctx, createSpritesheet,
		arg.OwnerID,
		arg.Name,
		arg.Definition,
		arg.Image,
	)
	var i Spritesheet
	err := row.Scan(
		&i.ID,
		&i.OwnerID,
		&i.Name,
		&i.Definition,
		&i.Image,
		&i.CreatedAt,
	)
	return i, err
}

const createTilemap = `-- name: CreateTilemap :one
INSERT INTO tilemaps (owner_id, name, definition) VALUES ($1, $2, $3) RETURNING id, owner_id, name, definition, created_at
`

type CreateTilemapParams struct {
	OwnerID    int32
	Name       string
	Definition json.RawMessage
}

func (q *Queries) CreateTilemap(ctx context.Context, arg CreateTilemapParams) (Tilemap, error) {
	row := q.db.QueryRowContext(ctx, createTilemap, arg.OwnerID, arg.Name, arg.Definition)
	var i Tilemap
	err := row.Scan(
		&i.ID,
		&i.OwnerID,
		&i.Name,
		&i.Definition,
		&i.CreatedAt,
	)
	return i, err
}

const createTilemapReference = `-- name: CreateTilemapReference :exec
INSERT INTO tilemap_references (tilemap_id, spritesheet_id) VALUES ($1, $2)
`

type CreateTilemapReferenceParams struct {
	TilemapID     int32
	SpritesheetID int32
}

func (q *Queries) CreateTilemapReference(ctx context.Context, arg CreateTilemapReferenceParams) error {
	_, err := q.db.ExecContext(ctx, createTilemapReference, arg.TilemapID, arg.SpritesheetID)
	return err
}

const deleteSpritesheetWithOwner = `-- name: DeleteSpritesheetWithOwner :exec
DELETE FROM spritesheets WHERE id = $1 AND owner_id = $2
`

type DeleteSpritesheetWithOwnerParams struct {
	ID      int32
	OwnerID int32
}

func (q *Queries) DeleteSpritesheetWithOwner(ctx context.Context, arg DeleteSpritesheetWithOwnerParams) error {
	_, err := q.db.ExecContext(ctx, deleteSpritesheetWithOwner, arg.ID, arg.OwnerID)
	return err
}

const deleteTilemapWithOwner = `-- name: DeleteTilemapWithOwner :exec
DELETE FROM tilemaps WHERE id = $1 AND owner_id = $2
`

type DeleteTilemapWithOwnerParams struct {
	ID      int32
	OwnerID int32
}

func (q *Queries) DeleteTilemapWithOwner(ctx context.Context, arg DeleteTilemapWithOwnerParams) error {
	_, err := q.db.ExecContext(ctx, deleteTilemapWithOwner, arg.ID, arg.OwnerID)
	return err
}

const getSpritesheetByID = `-- name: GetSpritesheetByID :one
SELECT id, owner_id, name, definition, image, created_at FROM spritesheets WHERE id = $1
`

func (q *Queries) GetSpritesheetByID(ctx context.Context, id int32) (Spritesheet, error) {
	row := q.db.QueryRowContext(ctx, getSpritesheetByID, id)
	var i Spritesheet
	err := row.Scan(
		&i.ID,
		&i.OwnerID,
		&i.Name,
		&i.Definition,
		&i.Image,
		&i.CreatedAt,
	)
	return i, err
}

const getThumbnailByID = `-- name: GetThumbnailByID :one
SELECT id, tilemap_id, spritesheet_id, content_type, image, width, height, created_at FROM thumbnails WHERE id = $1
`

type GetThumbnailByIDRow struct {
	ID            int32
	TilemapID     sql.NullInt32
	SpritesheetID sql.NullInt32
	ContentType   string
	Image         []byte
	Width         int32
	Height        int32
	CreatedAt     time.Time
}

func (q *Queries) GetThumbnailByID(ctx context.Context, id int32) (GetThumbnailByIDRow, error) {
	row := q.db.QueryRowContext(ctx, getThumbnailByID, id)
	var i GetThumbnailByIDRow
	err := row.Scan(
		&i.ID,
		&i.TilemapID,
		&i.SpritesheetID,
		&i.ContentType,
		&i.Image,
		&i.Width,
		&i.Height,
		&i.CreatedAt,
	)
	return i, err
}

const getTilemapByID = `-- name: GetTilemapByID :one
SELECT id, owner_id, name, definition, created_at FROM tilemaps WHERE id = $1
`

func (q *Queries) GetTilemapByID(ctx context.Context, id int32) (Tilemap, error) {
	row := q.db.QueryRowContext(ctx, getTilemapByID, id)
	var i Tilemap
	err := row.Scan(
		&i.ID,
		&i.OwnerID,
		&i.Name,
		&i.Definition,
		&i.CreatedAt,
	)
	return i, err
}

const insertThumbnailForOwnedTilemap = `-- name: InsertThumbnailForOwnedTilemap :execrows
WITH owned_tilemap AS (
  SELECT id FROM tilemaps WHERE owner_id = $6 AND id = $5
)
INSERT INTO thumbnails (tilemap_id, content_type, image, width, height)
SELECT owned_tilemap.id, $1, $2, $3, $4 FROM owned_tilemap
WHERE NOT EXISTS (SELECT id FROM thumbnails WHERE thumbnails.tilemap_id = $5)
`

type InsertThumbnailForOwnedTilemapParams struct {
	ContentType string
	Image       []byte
	Width       int32
	Height      int32
	TilemapID   sql.NullInt32
	OwnerID     int32
}

func (q *Queries) InsertThumbnailForOwnedTilemap(ctx context.Context, arg InsertThumbnailForOwnedTilemapParams) (int64, error) {
	result, err := q.db.ExecContext(ctx, insertThumbnailForOwnedTilemap,
		arg.ContentType,
		arg.Image,
		arg.Width,
		arg.Height,
		arg.TilemapID,
		arg.OwnerID,
	)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

const listSpritesheetsByOwnerID = `-- name: ListSpritesheetsByOwnerID :many
SELECT id, created_at, name, octet_length(definition::text) AS spritesheet_size, octet_length(image) AS image_size FROM spritesheets WHERE owner_id = $1
`

type ListSpritesheetsByOwnerIDRow struct {
	ID              int32
	CreatedAt       time.Time
	Name            string
	SpritesheetSize interface{}
	ImageSize       interface{}
}

func (q *Queries) ListSpritesheetsByOwnerID(ctx context.Context, ownerID int32) ([]ListSpritesheetsByOwnerIDRow, error) {
	rows, err := q.db.QueryContext(ctx, listSpritesheetsByOwnerID, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListSpritesheetsByOwnerIDRow
	for rows.Next() {
		var i ListSpritesheetsByOwnerIDRow
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.Name,
			&i.SpritesheetSize,
			&i.ImageSize,
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

const listSpritesheetsForTilemap = `-- name: ListSpritesheetsForTilemap :many
SELECT tilemap_id, spritesheet_id, s.name AS spritesheet_name FROM tilemap_references r JOIN spritesheets s ON s.id = r.spritesheet_id WHERE tilemap_id = $1
`

type ListSpritesheetsForTilemapRow struct {
	TilemapID       int32
	SpritesheetID   int32
	SpritesheetName string
}

func (q *Queries) ListSpritesheetsForTilemap(ctx context.Context, tilemapID int32) ([]ListSpritesheetsForTilemapRow, error) {
	rows, err := q.db.QueryContext(ctx, listSpritesheetsForTilemap, tilemapID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListSpritesheetsForTilemapRow
	for rows.Next() {
		var i ListSpritesheetsForTilemapRow
		if err := rows.Scan(&i.TilemapID, &i.SpritesheetID, &i.SpritesheetName); err != nil {
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

const listThumbnailsForSpritesheets = `-- name: ListThumbnailsForSpritesheets :many
SELECT id, spritesheet_id, content_type, width, height, created_at FROM thumbnails WHERE spritesheet_id = ANY($1::INTEGER[])
`

type ListThumbnailsForSpritesheetsRow struct {
	ID            int32
	SpritesheetID sql.NullInt32
	ContentType   string
	Width         int32
	Height        int32
	CreatedAt     time.Time
}

func (q *Queries) ListThumbnailsForSpritesheets(ctx context.Context, dollar_1 []int32) ([]ListThumbnailsForSpritesheetsRow, error) {
	rows, err := q.db.QueryContext(ctx, listThumbnailsForSpritesheets, pq.Array(dollar_1))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListThumbnailsForSpritesheetsRow
	for rows.Next() {
		var i ListThumbnailsForSpritesheetsRow
		if err := rows.Scan(
			&i.ID,
			&i.SpritesheetID,
			&i.ContentType,
			&i.Width,
			&i.Height,
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

const listThumbnailsForTilemaps = `-- name: ListThumbnailsForTilemaps :many
SELECT id, tilemap_id, content_type, width, height, created_at FROM thumbnails WHERE tilemap_id = ANY($1::INTEGER[])
`

type ListThumbnailsForTilemapsRow struct {
	ID          int32
	TilemapID   sql.NullInt32
	ContentType string
	Width       int32
	Height      int32
	CreatedAt   time.Time
}

func (q *Queries) ListThumbnailsForTilemaps(ctx context.Context, dollar_1 []int32) ([]ListThumbnailsForTilemapsRow, error) {
	rows, err := q.db.QueryContext(ctx, listThumbnailsForTilemaps, pq.Array(dollar_1))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListThumbnailsForTilemapsRow
	for rows.Next() {
		var i ListThumbnailsForTilemapsRow
		if err := rows.Scan(
			&i.ID,
			&i.TilemapID,
			&i.ContentType,
			&i.Width,
			&i.Height,
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

const listTilemapsByOwnerID = `-- name: ListTilemapsByOwnerID :many
SELECT id, created_at, name, octet_length(definition::text) AS tilemap_size FROM tilemaps WHERE owner_id = $1
`

type ListTilemapsByOwnerIDRow struct {
	ID          int32
	CreatedAt   time.Time
	Name        string
	TilemapSize interface{}
}

func (q *Queries) ListTilemapsByOwnerID(ctx context.Context, ownerID int32) ([]ListTilemapsByOwnerIDRow, error) {
	rows, err := q.db.QueryContext(ctx, listTilemapsByOwnerID, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListTilemapsByOwnerIDRow
	for rows.Next() {
		var i ListTilemapsByOwnerIDRow
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.Name,
			&i.TilemapSize,
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

const updateThumbnailForOwnedTilemap = `-- name: UpdateThumbnailForOwnedTilemap :exec
WITH owned_tilemap AS (
  SELECT id FROM tilemaps WHERE owner_id = $5 AND tilemaps.id = $6
)
UPDATE thumbnails SET content_type = $1, image = $2, width = $3, height = $4, created_at = NOW()
WHERE tilemap_id = (SELECT id FROM owned_tilemap)
`

type UpdateThumbnailForOwnedTilemapParams struct {
	ContentType string
	Image       []byte
	Width       int32
	Height      int32
	OwnerID     int32
	TilemapID   int32
}

func (q *Queries) UpdateThumbnailForOwnedTilemap(ctx context.Context, arg UpdateThumbnailForOwnedTilemapParams) error {
	_, err := q.db.ExecContext(ctx, updateThumbnailForOwnedTilemap,
		arg.ContentType,
		arg.Image,
		arg.Width,
		arg.Height,
		arg.OwnerID,
		arg.TilemapID,
	)
	return err
}
