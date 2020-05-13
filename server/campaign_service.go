package main

import (
	"errors"
	"net/http"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type CampaignService struct {
	db *models.Queries
}

type ListCampaignsRequest struct {
}

type ListCampaignsResponse struct {
	Campaigns []models.CampaignWithEncounters
}

func (s *AssetService) ListCampaigns(r *http.Request, args *ListCampaignsRequest, reply *ListCampaignsResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	return nil
}
