package models

import "github.com/jmoiron/sqlx"

type Database struct {
	*sqlx.DB
}
