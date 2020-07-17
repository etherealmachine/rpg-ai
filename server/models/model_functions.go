package models

import (
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
	Encounters []Encounter
}

func (c *Campaign) Path() string {
	return fmt.Sprintf("/campaign/%d", c.ID)
}
