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
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	spritesheets, err := s.db.ListSpritesheetsByOwnerID(r.Context(), u.ID)
	if err != nil {
		return err
	}
	reply.Spritesheets = spritesheets
	tilemaps, err := s.db.ListTilemapsByOwnerID(r.Context(), u.ID)
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

type ListThumbnailsRequest struct {
	TilemapIDs     []int32
	SpritesheetIDs []int32
}

type ListThumbnailsResponse struct {
	TilemapThumbnailIDs     map[int32][]int32
	SpritesheetThumbnailIDs map[int32][]int32
}

func (s *AssetService) ListThumbnails(r *http.Request, args *ListThumbnailsRequest, reply *ListThumbnailsResponse) error {
	reply.TilemapThumbnailIDs = make(map[int32][]int32)
	reply.SpritesheetThumbnailIDs = make(map[int32][]int32)
	trows, err := s.db.ListThumbnailsForTilemaps(r.Context(), args.TilemapIDs)
	if err != nil {
		return err
	}
	for _, row := range trows {
		if row.TilemapID.Valid {
			reply.TilemapThumbnailIDs[row.TilemapID.Int32] = append(reply.TilemapThumbnailIDs[row.TilemapID.Int32], row.ID)
		}
	}
	srows, err := s.db.ListThumbnailsForSpritesheets(r.Context(), args.SpritesheetIDs)
	if err != nil {
		return err
	}
	for _, row := range srows {
		if row.SpritesheetID.Valid {
			reply.SpritesheetThumbnailIDs[row.SpritesheetID.Int32] = append(reply.SpritesheetThumbnailIDs[row.SpritesheetID.Int32], row.ID)
		}
	}
	return nil
}
