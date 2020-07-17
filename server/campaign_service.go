package main

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type CampaignService struct {
	db *models.Queries
}

type CreateCampaignRequest struct {
	Name        string
	Description string
}

type CreateCampaignResponse struct {
}

func (s *CampaignService) CreateCampaign(r *http.Request, args *CreateCampaignRequest, reply *CreateCampaignResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	_, err := s.db.CreateCampaign(r.Context(), models.CreateCampaignParams{OwnerID: u.ID, Name: args.Name, Description: sql.NullString{String: args.Description}})
	return err
}

type DeleteCampaignRequest struct {
	ID int32
}

type DeleteCampaignResponse struct {
}

func (s *CampaignService) DeleteCampaign(r *http.Request, args *DeleteCampaignRequest, reply *DeleteCampaignResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.DeleteCampaign(r.Context(), models.DeleteCampaignParams{OwnerID: u.ID, ID: args.ID})
}
