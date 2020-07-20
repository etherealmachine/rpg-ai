package main

import (
	"database/sql"
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
	TilemapID  sql.NullInt32
}

type CreateEncounterResponse struct {
}

func (s *EncounterService) CreateEncounter(r *http.Request, args *CreateEncounterRequest, reply *CreateEncounterResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	_, err := s.db.CreateEncounter(r.Context(), models.CreateEncounterParams{
		CampaignID: args.CampaignID,
		Name:       args.Name,
		TilemapID:  args.TilemapID,
		OwnerID:    u.ID,
	})
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

type UpdateEncounterRequest struct {
	EncounterID int32
	Name        string
	Description sql.NullString
	TilemapID   sql.NullInt32
}

type UpdateEncounterResponse struct {
}

func (s *EncounterService) UpdateEncounter(r *http.Request, args *UpdateEncounterRequest, reply *UpdateEncounterResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.UpdateEncounter(r.Context(), models.UpdateEncounterParams{
		ID:          args.EncounterID,
		OwnerID:     u.ID,
		Name:        args.Name,
		Description: args.Description,
		TilemapID:   args.TilemapID,
	})
}
