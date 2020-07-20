package main

import (
	"errors"
	"net/http"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type CampaignService struct {
	db *models.Queries
}

type Empty struct {
}

func (s *CampaignService) CreateCampaign(r *http.Request, arg *models.CreateCampaignParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	_, err := s.db.CreateCampaign(r.Context(), *arg)
	return err
}

func (s *CampaignService) DeleteCampaign(r *http.Request, arg *models.DeleteCampaignParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.DeleteCampaign(r.Context(), *arg)
}
