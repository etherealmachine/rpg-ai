package models

import (
	"context"
	"database/sql"
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

type FilledTilemap struct {
	Tilemap
	Thumbnails []Thumbnail
}

func (t *Thumbnail) Path() string {
	return fmt.Sprintf("/thumbnail/%s", base64.StdEncoding.EncodeToString([]byte(t.Hash)))
}

type FilledCampaign struct {
	Campaign
	Encounters []FilledEncounter
	Characters []Character
}

type FilledEncounter struct {
	Encounter
	Tilemap    *Tilemap
	Characters []Character
}

func ListFilledCampaignsByOwnerID(ctx context.Context, db *Queries, ownerID int32) []FilledCampaign {
	campaigns, err := db.ListCampaignsByOwnerID(ctx, ownerID)
	if err != nil {
		panic(err)
	}
	filledCampaigns := make([]FilledCampaign, len(campaigns))
	for i, campaign := range campaigns {
		characters, err := db.ListCharactersForCampaign(ctx, campaign.ID)
		if err != nil {
			panic(err)
		}
		encounters, err := db.ListEncountersForCampaign(ctx, campaign.ID)
		if err != nil {
			panic(err)
		}
		filledEncounters := make([]FilledEncounter, len(encounters))
		for j, encounter := range encounters {
			characters, err := db.ListCharactersForEncounter(ctx, encounter.ID)
			if err != nil {
				panic(err)
			}
			var tilemap *Tilemap
			if encounter.TilemapID.Valid {
				tmp, err := db.GetTilemapByID(ctx, encounter.TilemapID.Int32)
				if err != nil && err != sql.ErrNoRows {
					panic(err)
				}
				tilemap = &tmp
			}
			filledEncounters[j] = FilledEncounter{
				Encounter:  encounter,
				Tilemap:    tilemap,
				Characters: characters,
			}
		}
		filledCampaigns[i] = FilledCampaign{
			Campaign:   campaign,
			Encounters: filledEncounters,
			Characters: characters,
		}
	}
	return filledCampaigns
}
