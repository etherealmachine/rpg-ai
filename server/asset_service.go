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
