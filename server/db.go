package main

import (
	"database/sql"
	"time"

	"github.com/jmoiron/sqlx"
)

type Database struct {
	*sqlx.DB
}

type User struct {
	ID        int32        `db:"id"`
	Email     string       `db:"email"`
	Admin     sql.NullBool `db:"admin"`
	CreatedOn time.Time    `db:"created_on"`
	LastLogin *time.Time   `db:"last_login"`
}

func (db *Database) GetUserByEmail(email string) (*User, error) {
	u := new(User)
	err := db.Get(u, "SELECT * FROM users WHERE email=$1", email)
	return u, err
}
