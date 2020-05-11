package models

import (
	"context"
	"fmt"
)

type Upload struct {
	Filename string
	Json     map[string]interface{}
	Filedata []byte
	Source   string
	Sources  []string
}

func CreateAssets(ctx context.Context, db *Queries, ownerID int32, assets []*Upload, referenceMap map[string]int32) error {
	images := make(map[string]*Upload)
	spritesheets := make(map[string]*Upload)
	tilemaps := make(map[string]*Upload)
	for _, asset := range assets {
		if asset.Json == nil {
			images[asset.Filename] = asset
		} else {
			if image, ok := asset.Json["image"].(string); ok {
				spritesheets[asset.Filename] = asset
				asset.Source = image
			} else if tilesets, ok := asset.Json["tilesets"].([]interface{}); ok {
				tilemaps[asset.Filename] = asset
				for _, iface := range tilesets {
					if tileset, ok := iface.(map[string]interface{}); ok {
						if source, ok := tileset["source"].(string); ok {
							asset.Sources = append(asset.Sources, source)
						}
					}
				}
			}
		}
	}
	spritesheetIDs := make(map[string]int32)
	for _, asset := range spritesheets {
		spritesheet, err := db.CreateSpritesheet(ctx, CreateSpritesheetParams{
			OwnerID:    ownerID,
			Name:       asset.Filename,
			Definition: asset.Filedata,
			Image:      images[asset.Source].Filedata,
		})
		if err != nil {
			return err
		}
		spritesheetIDs[asset.Filename] = spritesheet.ID
	}
	for _, asset := range tilemaps {
		var sourceIDs []int32
		for _, source := range asset.Sources {
			spritesheetID, ok := spritesheetIDs[source]
			if !ok {
				spritesheetID, ok = referenceMap[source]
				if !ok {
					panic(fmt.Sprintf("missing reference for source %s", source))
				}
			}
			sourceIDs = append(sourceIDs, spritesheetID)
		}
		tilemap, err := db.CreateTilemap(ctx, CreateTilemapParams{
			OwnerID:    ownerID,
			Name:       asset.Filename,
			Definition: asset.Filedata,
		})
		if err != nil {
			return err
		}
		for _, sourceID := range sourceIDs {
			if err := db.CreateTilemapReference(ctx, CreateTilemapReferenceParams{TilemapID: tilemap.ID, SpritesheetID: sourceID}); err != nil {
				return err
			}
		}
	}
	return nil
}
