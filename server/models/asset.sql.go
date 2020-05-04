// Code generated by sqlc. DO NOT EDIT.
// source: asset.sql

package models

import (
	"context"
	"time"
)

const createAsset = `-- name: CreateAsset :one
INSERT INTO assets (owner_id, content_type, filename, filedata) VALUES ($1, $2, $3, $4) RETURNING id, owner_id, content_type, filename, filedata, created_at
`

type CreateAssetParams struct {
	OwnerID     int32
	ContentType string
	Filename    string
	Filedata    []byte
}

func (q *Queries) CreateAsset(ctx context.Context, arg CreateAssetParams) (Asset, error) {
	row := q.db.QueryRowContext(ctx, createAsset,
		arg.OwnerID,
		arg.ContentType,
		arg.Filename,
		arg.Filedata,
	)
	var i Asset
	err := row.Scan(
		&i.ID,
		&i.OwnerID,
		&i.ContentType,
		&i.Filename,
		&i.Filedata,
		&i.CreatedAt,
	)
	return i, err
}

const createAssetReference = `-- name: CreateAssetReference :exec
INSERT INTO asset_references (asset_id, referenced_asset_id) VALUES ($1, $2)
`

type CreateAssetReferenceParams struct {
	AssetID           int32
	ReferencedAssetID int32
}

func (q *Queries) CreateAssetReference(ctx context.Context, arg CreateAssetReferenceParams) error {
	_, err := q.db.ExecContext(ctx, createAssetReference, arg.AssetID, arg.ReferencedAssetID)
	return err
}

const deleteAssetWithOwner = `-- name: DeleteAssetWithOwner :exec
DELETE FROM assets WHERE id = $1 AND owner_id = $2
`

type DeleteAssetWithOwnerParams struct {
	ID      int32
	OwnerID int32
}

func (q *Queries) DeleteAssetWithOwner(ctx context.Context, arg DeleteAssetWithOwnerParams) error {
	_, err := q.db.ExecContext(ctx, deleteAssetWithOwner, arg.ID, arg.OwnerID)
	return err
}

const getAssetByID = `-- name: GetAssetByID :one
SELECT id, owner_id, content_type, filename, filedata, created_at FROM assets WHERE id = $1
`

func (q *Queries) GetAssetByID(ctx context.Context, id int32) (Asset, error) {
	row := q.db.QueryRowContext(ctx, getAssetByID, id)
	var i Asset
	err := row.Scan(
		&i.ID,
		&i.OwnerID,
		&i.ContentType,
		&i.Filename,
		&i.Filedata,
		&i.CreatedAt,
	)
	return i, err
}

const listAssetMetadataByOwnerID = `-- name: ListAssetMetadataByOwnerID :many
SELECT id, owner_id, created_at, filename, content_type, octet_length(filedata) as size FROM assets WHERE owner_id = $1
`

type ListAssetMetadataByOwnerIDRow struct {
	ID          int32
	OwnerID     int32
	CreatedAt   time.Time
	Filename    string
	ContentType string
	Size        interface{}
}

func (q *Queries) ListAssetMetadataByOwnerID(ctx context.Context, ownerID int32) ([]ListAssetMetadataByOwnerIDRow, error) {
	rows, err := q.db.QueryContext(ctx, listAssetMetadataByOwnerID, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListAssetMetadataByOwnerIDRow
	for rows.Next() {
		var i ListAssetMetadataByOwnerIDRow
		if err := rows.Scan(
			&i.ID,
			&i.OwnerID,
			&i.CreatedAt,
			&i.Filename,
			&i.ContentType,
			&i.Size,
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
