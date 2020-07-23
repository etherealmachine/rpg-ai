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

type ListCampaignsResponse struct {
	Campaigns []models.FilledCampaign
}

func (s *CampaignService) ListCampaigns(r *http.Request, arg *Empty, reply *ListCampaignsResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	reply.Campaigns = models.ListFilledCampaignsByOwnerID(r.Context(), db, u.ID)
	return nil
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

func (s *CampaignService) UpdateCampaign(r *http.Request, arg *models.UpdateCampaignParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.UpdateCampaign(r.Context(), *arg)
}

type ListCharactersResponse struct {
	Characters []models.Character
}

func (s *CampaignService) ListCharacters(r *http.Request, arg *Empty, reply *ListCharactersResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	var err error
	reply.Characters, err = s.db.ListCharactersByOwnerID(r.Context(), u.ID)
	return err
}

type SearchCharactersRequest struct {
	Name string
}

func (s *CampaignService) SearchCharacters(r *http.Request, arg *SearchCharactersRequest, reply *ListCharactersResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	var err error
	reply.Characters, err = s.db.SearchCharacters(r.Context(), arg.Name)
	return err
}

func (s *CampaignService) CreateCharacter(r *http.Request, arg *models.CreateCharacterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	_, err := s.db.CreateCharacter(r.Context(), *arg)
	return err
}

func (s *CampaignService) DeleteCharacter(r *http.Request, arg *models.DeleteCharacterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.DeleteCharacter(r.Context(), *arg)
}

func (s *CampaignService) UpdateCharacter(r *http.Request, arg *models.UpdateCharacterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.UpdateCharacter(r.Context(), *arg)
}

func (s *CampaignService) CreateEncounter(r *http.Request, arg *models.CreateEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	_, err := s.db.CreateEncounter(r.Context(), *arg)
	return err
}

func (s *CampaignService) DeleteEncounter(r *http.Request, arg *models.DeleteEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.DeleteEncounter(r.Context(), *arg)
}

func (s *CampaignService) UpdateEncounter(r *http.Request, arg *models.UpdateEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.UpdateEncounter(r.Context(), *arg)
}

func (s *CampaignService) AddCharacterToEncounter(r *http.Request, arg *models.AddCharacterToEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.AddCharacterToEncounter(r.Context(), *arg)
}

func (s *CampaignService) RemoveCharacterFromEncounter(r *http.Request, arg *models.RemoveCharacterFromEncounterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.RemoveCharacterFromEncounter(r.Context(), *arg)
}
