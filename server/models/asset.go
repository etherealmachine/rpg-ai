package models

import (
	"time"
)

type Asset struct {
	ID          int32     `db:"id"`
	OwnerID     int32     `db:"owner_id"`
	ContentType string    `db:"content_type"`
	Filename    string    `db:"filename"`
	Filedata    []byte    `db:"filedata"`
	CreatedOn   time.Time `db:"created_on"`
}

func (db *Database) GetAssetsByOwnerID(ownerID int32) ([]Asset, error) {
	assets := []Asset{}
	err := db.Select(&assets, "SELECT * FROM assets WHERE owner_id=$1", ownerID)
	return assets, err
}
