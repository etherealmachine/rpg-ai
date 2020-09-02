#!/bin/bash
go generate server/*.go
go run server/*.go generate src/
DEV=true \
DATABASE_URL=postgres://`whoami`:`whoami`@localhost/`whoami`?sslmode=disable \
SESSION_KEY=123 \
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
FACEBOOK_APP_ID=$FACEBOOK_APP_ID \
go run server/*.go
