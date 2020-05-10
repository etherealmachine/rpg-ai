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
	Spritesheets []models.Spritesheet
	Tilemaps     []models.TilemapWithThumbnails
}

func (s *AssetService) ListAssets(r *http.Request, args *ListAssetsRequest, reply *ListAssetsResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	spritesheets, err := s.db.ListSpritesheetsByOwnerID(r.Context(), u.ID)
	if err != nil {
		return err
	}
	for _, s := range spritesheets {
		reply.Spritesheets = append(reply.Spritesheets, models.Spritesheet{
			ID:          s.ID,
			OwnerID:     u.ID,
			Name:        s.Name,
			Description: s.Description,
			Hash:        s.Hash,
			CreatedAt:   s.CreatedAt,
		})
	}
	tilemaps, err := s.db.ListTilemapsByOwnerID(r.Context(), u.ID)
	if err != nil {
		return err
	}
	for _, t := range tilemaps {
		reply.Tilemaps = append(reply.Tilemaps, models.TilemapWithThumbnails{
			Tilemap: models.Tilemap{
				ID:          t.ID,
				OwnerID:     u.ID,
				Name:        t.Name,
				Description: t.Description,
				Hash:        t.Hash,
				CreatedAt:   t.CreatedAt,
			},
		})
	}
	return nil
}

type DeleteAssetRequest struct {
	ID int32
}

type DeleteAssetResponse struct {
}

func (s *AssetService) DeleteSpritesheet(r *http.Request, args *DeleteAssetRequest, reply *DeleteAssetResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.DeleteSpritesheetWithOwner(r.Context(), models.DeleteSpritesheetWithOwnerParams{ID: args.ID, OwnerID: u.ID})
}

func (s *AssetService) DeleteTilemap(r *http.Request, args *DeleteAssetRequest, reply *DeleteAssetResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.DeleteTilemapWithOwner(r.Context(), models.DeleteTilemapWithOwnerParams{ID: args.ID, OwnerID: u.ID})
}

type ListSpritesheetsForTilemapRequest struct {
	TilemapID int32
}

type ListSpritesheetsForTilemapResponse struct {
	References []models.ListSpritesheetsForTilemapRow
}

func (s *AssetService) ListReferences(r *http.Request, args *ListSpritesheetsForTilemapRequest, reply *ListSpritesheetsForTilemapResponse) error {
	var err error
	reply.References, err = s.db.ListSpritesheetsForTilemap(r.Context(), args.TilemapID)
	if err != nil {
		return err
	}
	return nil
}
