package main

import (
	"errors"
	"net/http"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type CharacterService struct {
	db *models.Queries
}

func (s *CharacterService) CreateCharacter(r *http.Request, arg *models.CreateCharacterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	_, err := s.db.CreateCharacter(r.Context(), *arg)
	return err
}

func (s *CharacterService) DeleteCharacter(r *http.Request, arg *models.DeleteCharacterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.DeleteCharacter(r.Context(), *arg)
}

func (s *CharacterService) UpdateCharacter(r *http.Request, arg *models.UpdateCharacterParams, reply *Empty) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	arg.OwnerID = u.ID
	return s.db.UpdateCharacter(r.Context(), *arg)
}
