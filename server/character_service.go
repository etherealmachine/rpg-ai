package main

import (
	"errors"
	"net/http"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type CharacterService struct {
	db *models.Queries
}

type CreateCharacterRequest struct {
	Name       string
	Definition string
}

type CreateCharacterResponse struct {
}

func (s *CharacterService) CreateCharacter(r *http.Request, args *CreateCharacterRequest, reply *CreateCharacterResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	_, err := s.db.CreateCharacter(r.Context(), models.CreateCharacterParams{OwnerID: u.ID, Name: args.Name, Definition: []byte(args.Definition)})
	return err
}

type DeleteCharacterRequest struct {
	ID int32
}

type DeleteCharacterResponse struct {
}

func (s *CharacterService) DeleteCharacter(r *http.Request, args *DeleteCharacterRequest, reply *DeleteCharacterResponse) error {
	u := currentUser(r)
	if u == nil {
		return errors.New("no authenticated user found")
	}
	return s.db.DeleteCharacter(r.Context(), models.DeleteCharacterParams{OwnerID: u.ID, ID: args.ID})
}
