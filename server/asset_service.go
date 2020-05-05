package main

import (
	"errors"
	"net/http"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type AssetService struct {
	db *models.Queries
}

type ListAssetsRequest struct {
}

type ListAssetsResponse struct {
	Spritesheets []models.ListSpritesheetsByOwnerIDRow
	Tilemaps     []models.ListTilemapsByOwnerIDRow
}

func (s *AssetService) ListAssets(r *http.Request, args *ListAssetsRequest, reply *ListAssetsResponse) error {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser == nil {
		return errors.New("no authenticated user found")
	}
	spritesheets, err := s.db.ListSpritesheetsByOwnerID(r.Context(), authenticatedUser.InternalUser.ID)
	if err != nil {
		return err
	}
	reply.Spritesheets = spritesheets
	tilemaps, err := s.db.ListTilemapsByOwnerID(r.Context(), authenticatedUser.InternalUser.ID)
	if err != nil {
		return err
	}
	reply.Tilemaps = tilemaps
	return nil
}

type DeleteAssetRequest struct {
	ID int32
}

type DeleteAssetResponse struct {
}

func (s *AssetService) DeleteSpritesheet(r *http.Request, args *DeleteAssetRequest, reply *DeleteAssetResponse) error {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.DeleteSpritesheetWithOwner(r.Context(), models.DeleteSpritesheetWithOwnerParams{ID: args.ID, OwnerID: authenticatedUser.InternalUser.ID})
}

func (s *AssetService) DeleteTilemap(r *http.Request, args *DeleteAssetRequest, reply *DeleteAssetResponse) error {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.DeleteTilemapWithOwner(r.Context(), models.DeleteTilemapWithOwnerParams{ID: args.ID, OwnerID: authenticatedUser.InternalUser.ID})
}

type ListSpritesheetsForTilemapRequest struct {
	ID int32
}

type ListSpritesheetsForTilemapResponse struct {
	References []models.ListSpritesheetsForTilemapRow
}

func (s *AssetService) ListReferences(r *http.Request, args *ListSpritesheetsForTilemapRequest, reply *ListSpritesheetsForTilemapResponse) error {
	var err error
	reply.References, err = s.db.ListSpritesheetsForTilemap(r.Context(), args.ID)
	if err != nil {
		return err
	}
	return nil
}
