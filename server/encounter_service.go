package main

import (
	"errors"
	"net/http"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type EncounterService struct {
	db *models.Queries
}

func (s *EncounterService) CreateEncounter(r *http.Request, arg *models.CreateEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	_, err := s.db.CreateEncounter(r.Context(), *arg)
	return err
}

func (s *EncounterService) DeleteEncounter(r *http.Request, arg *models.DeleteEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.DeleteEncounter(r.Context(), *arg)
}

func (s *EncounterService) UpdateEncounter(r *http.Request, arg *models.UpdateEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.UpdateEncounter(r.Context(), *arg)
}

func (s *EncounterService) AddCharacterToEncounter(r *http.Request, arg *models.AddCharacterToEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.AddCharacterToEncounter(r.Context(), *arg)
}

func (s *EncounterService) RemoveCharacterFromEncounter(r *http.Request, arg *models.RemoveCharacterFromEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.RemoveCharacterFromEncounter(r.Context(), *arg)
}
