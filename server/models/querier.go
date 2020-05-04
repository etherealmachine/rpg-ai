// Code generated by sqlc. DO NOT EDIT.

package models

import (
	"context"
)

type Querier interface {
	CreateAsset(ctx context.Context, arg CreateAssetParams) (Asset, error)
	CreateAssetReference(ctx context.Context, arg CreateAssetReferenceParams) error
	DeleteAssetWithOwner(ctx context.Context, arg DeleteAssetWithOwnerParams) error
	GetAssetByID(ctx context.Context, id int32) (Asset, error)
	GetUserByEmail(ctx context.Context, email string) (User, error)
	ListAssetMetadataByOwnerID(ctx context.Context, ownerID int32) ([]ListAssetMetadataByOwnerIDRow, error)
}

var _ Querier = (*Queries)(nil)
