package models

import (
	"context"
	"encoding/base64"
	"fmt"
)

func (s *Spritesheet) DownloadPath() string {
	return fmt.Sprintf("/spritesheet/%s", base64.StdEncoding.EncodeToString([]byte(s.Hash)))
}

func (s *Spritesheet) ImagePath() string {
	return fmt.Sprintf("/spritesheet/image/%s", base64.StdEncoding.EncodeToString([]byte(s.Hash)))
}

func (s *Spritesheet) ThumbnailPath() string {
	return fmt.Sprintf("/spritesheet/image/%s", base64.StdEncoding.EncodeToString([]byte(s.Hash)))
}

func (t *Tilemap) DownloadPath() string {
	return fmt.Sprintf("/tilemap/%s", base64.StdEncoding.EncodeToString([]byte(t.Hash)))
}

func (t *Tilemap) MapPath() string {
	return fmt.Sprintf("/map/%s", base64.StdEncoding.EncodeToString([]byte(t.Hash)))
}

type TilemapWithThumbnails struct {
	Tilemap
	Thumbnails []Thumbnail
}

func (t *Thumbnail) Path() string {
	return fmt.Sprintf("/thumbnail/%s", base64.StdEncoding.EncodeToString([]byte(t.Hash)))
}

type CampaignWithEncounters struct {
	Campaign
	Encounters []EncounterWithCharacters
}

type EncounterWithCharacters struct {
	Encounter
	Characters []Character
}

func ListCampaignsWithEncountersByOwnerID(ctx context.Context, db *Queries, ownerID int32) []CampaignWithEncounters {
	campaigns, err := db.ListCampaignsByOwnerID(ctx, ownerID)
	if err != nil {
		panic(err)
	}
	campaignsWithEncounters := make([]CampaignWithEncounters, len(campaigns))
	for i, campaign := range campaigns {
		encounters, err := db.ListEncountersForCampaign(ctx, campaign.ID)
		if err != nil {
			panic(err)
		}
		encountersWithCharacters := make([]EncounterWithCharacters, len(encounters))
		for j, encounter := range encounters {
			characters, err := db.ListCharactersForEncounter(ctx, encounter.ID)
			if err != nil {
				panic(err)
			}
			encountersWithCharacters[j] = EncounterWithCharacters{
				Encounter:  encounter,
				Characters: characters,
			}
		}
		campaignsWithEncounters[i] = CampaignWithEncounters{
			Campaign:   campaign,
			Encounters: encountersWithCharacters,
		}
	}
	return campaignsWithEncounters
}
