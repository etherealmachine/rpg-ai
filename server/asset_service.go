package main

import (
	"context"
	"encoding/json"
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
	Assets []models.ListAssetMetadataByOwnerIDRow
}

func (s *AssetService) ListAssets(r *http.Request, args *ListAssetsRequest, reply *ListAssetsResponse) error {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser == nil {
		return errors.New("no authenticated user found")
	}
	assets, err := s.db.ListAssetMetadataByOwnerID(r.Context(), authenticatedUser.InternalUser.ID)
	if err != nil {
		return err
	}
	reply.Assets = assets
	return nil
}

type DeleteAssetRequest struct {
	ID int32
}

type DeleteAssetResponse struct {
}

func (s *AssetService) DeleteAsset(r *http.Request, args *DeleteAssetRequest, reply *DeleteAssetResponse) error {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.DeleteAssetWithOwner(r.Context(), models.DeleteAssetWithOwnerParams{ID: args.ID, OwnerID: authenticatedUser.InternalUser.ID})
}

type ListReferencesRequest struct {
	ID int32
}

type ListReferencesResponse struct {
	References []models.ListReferencesByIDRow
}

func (s *AssetService) ListReferences(r *http.Request, args *ListReferencesRequest, reply *ListReferencesResponse) error {
	var err error
	reply.References, err = s.db.ListReferencesByID(r.Context(), args.ID)
	if err != nil {
		return err
	}
	return nil
}

type tiledAssetUpload struct {
	params   *models.CreateAssetParams
	json     map[string]interface{}
	image    string
	tilesets []string
}

func bulkUploadAssets(ctx context.Context, db *models.Queries, assets []*models.CreateAssetParams) error {
	images := make(map[string]*models.CreateAssetParams)
	tilesets := make(map[string]*tiledAssetUpload)
	tilemaps := make(map[string]*tiledAssetUpload)
	for _, asset := range assets {
		if asset.ContentType == "image/png" || asset.ContentType == "image/jpeg" {
			images[asset.Filename] = asset
		} else if asset.ContentType == "application/json" {
			tiledAsset := &tiledAssetUpload{
				params: asset,
				json:   make(map[string]interface{}),
			}
			if err := json.Unmarshal(asset.Filedata, &(tiledAsset.json)); err != nil {
				return err
			}
			if image, ok := tiledAsset.json["image"].(string); ok {
				tilesets[asset.Filename] = tiledAsset
				tiledAsset.image = image
			} else if tilesets, ok := tiledAsset.json["tilesets"].([]interface{}); ok {
				tilemaps[asset.Filename] = tiledAsset
				for _, iface := range tilesets {
					if tileset, ok := iface.(map[string]interface{}); ok {
						if source, ok := tileset["source"].(string); ok {
							tiledAsset.tilesets = append(tiledAsset.tilesets, source)
						}
					}
				}
			}
		}
	}
	imageIDs := make(map[string]int32)
	tilesetIDs := make(map[string]int32)
	for _, asset := range images {
		a, err := db.CreateAsset(ctx, *asset)
		if err != nil {
			return err
		}
		imageIDs[a.Filename] = a.ID
	}
	for _, tileset := range tilesets {
		imageID := imageIDs[tileset.image]
		a, err := db.CreateAsset(ctx, *tileset.params)
		if err != nil {
			return err
		}
		if err := db.CreateAssetReference(ctx, models.CreateAssetReferenceParams{AssetID: a.ID, ReferencedAssetID: imageID}); err != nil {
			return err
		}
		tilesetIDs[a.Filename] = a.ID
	}
	if len(tilemaps) == 0 {
		panic("no tilemaps")
	}
	for _, tilemap := range tilemaps {
		var sourceIDs []int32
		for _, tileset := range tilemap.tilesets {
			sourceIDs = append(sourceIDs, tilesetIDs[tileset])
		}
		a, err := db.CreateAsset(ctx, *tilemap.params)
		if err != nil {
			return err
		}
		for _, sourceID := range sourceIDs {
			if err := db.CreateAssetReference(ctx, models.CreateAssetReferenceParams{AssetID: a.ID, ReferencedAssetID: sourceID}); err != nil {
				return err
			}
		}
	}
	return nil
}
