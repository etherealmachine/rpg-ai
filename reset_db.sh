#!/bin/bash
psql -c "drop table assets cascade"
psql -c "drop table asset_references cascade"
psql -c "drop table users cascade"
psql < migrations/create_users_table.sql
psql < migrations/create_assets_table.sql
