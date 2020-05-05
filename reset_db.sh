#!/bin/bash
dropdb `whoami`
createdb `whoami`
psql < migrations/create_users_table.sql
psql < migrations/create_spritesheets_and_tilemaps_tables.sql
