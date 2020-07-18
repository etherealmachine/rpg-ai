package main

import (
	"errors"
	"net/http"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type EncounterService struct {
	db *models.Queries
}

type CreateEncounterRequest struct {
	CampaignID int32
	Name       string
}

type CreateEncounterResponse struct {
}

func (s *EncounterService) CreateEncounter(r *http.Request, args *CreateEncounterRequest, reply *CreateEncounterResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	_, err := s.db.CreateEncounter(r.Context(), models.CreateEncounterParams{CampaignID: args.CampaignID, Name: args.Name, OwnerID: u.ID})
	return err
}

type DeleteEncounterRequest struct {
	ID int32
}

type DeleteEncounterResponse struct {
}

func (s *EncounterService) DeleteEncounter(r *http.Request, args *DeleteEncounterRequest, reply *DeleteEncounterResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.DeleteEncounter(r.Context(), models.DeleteEncounterParams{OwnerID: u.ID, ID: args.ID})
}
