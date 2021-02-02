# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_02_01_211644) do

  create_table "abilities", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.integer "record_id", null: false
    t.integer "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum", null: false
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.integer "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "alignments", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "background_items", id: false, force: :cascade do |t|
    t.integer "background_id", null: false
    t.integer "item_id", null: false
  end

  create_table "background_languages", id: false, force: :cascade do |t|
    t.integer "background_id", null: false
    t.integer "language_id", null: false
  end

  create_table "background_proficiencies", id: false, force: :cascade do |t|
    t.integer "background_id", null: false
    t.integer "skill_id", null: false
  end

  create_table "backgrounds", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "character_class_levels", force: :cascade do |t|
    t.integer "character_class_id"
    t.integer "level"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["character_class_id"], name: "index_character_class_levels_on_character_class_id"
  end

  create_table "character_class_proficiencies", id: false, force: :cascade do |t|
    t.integer "character_class_id", null: false
    t.integer "skill_id", null: false
  end

  create_table "character_classes", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.integer "hit_die"
    t.integer "ability_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["ability_id"], name: "index_character_classes_on_ability_id"
  end

  create_table "character_classes_spells", id: false, force: :cascade do |t|
    t.integer "spell_id", null: false
    t.integer "character_class_id", null: false
  end

  create_table "conditions", force: :cascade do |t|
    t.string "name"
    t.string "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "damage_types", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "damage_types_items", id: false, force: :cascade do |t|
    t.integer "item_id", null: false
    t.integer "damage_type_id", null: false
  end

  create_table "feats", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "items", force: :cascade do |t|
    t.string "name"
    t.boolean "magical"
    t.boolean "attunement"
    t.string "rarity"
    t.integer "range"
    t.string "damage"
    t.decimal "value"
    t.decimal "weight"
    t.integer "armor_class"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "languages", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "monster_abilities", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "ability_id", null: false
    t.integer "score"
  end

  create_table "monster_condition_immunities", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "condition_id", null: false
  end

  create_table "monster_immunities", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "damage_type_id", null: false
  end

  create_table "monster_languages", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "language_id", null: false
  end

  create_table "monster_resistances", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "damage_type_id", null: false
  end

  create_table "monster_saves", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "ability_id", null: false
    t.integer "bonus"
  end

  create_table "monster_senses", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "sense_id", null: false
    t.integer "distance"
  end

  create_table "monster_skills", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "skill_id", null: false
    t.integer "bonus"
  end

  create_table "monster_spell_slots", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "spell_slot_id", null: false
  end

  create_table "monster_spells", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "spell_id", null: false
  end

  create_table "monster_types", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "monster_types_monsters", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "monster_type_id", null: false
  end

  create_table "monster_vulnerabilities", id: false, force: :cascade do |t|
    t.integer "monster_id", null: false
    t.integer "damage_type_id", null: false
  end

  create_table "monsters", force: :cascade do |t|
    t.string "name"
    t.integer "challenge_rating"
    t.integer "armor_class"
    t.string "hit_points"
    t.integer "passive_perception"
    t.integer "size_id"
    t.integer "speed"
    t.integer "alignment_id"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["alignment_id"], name: "index_monsters_on_alignment_id"
    t.index ["size_id"], name: "index_monsters_on_size_id"
  end

  create_table "races", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.integer "size_id"
    t.integer "speed"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["size_id"], name: "index_races_on_size_id"
  end

  create_table "senses", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "sizes", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "skills", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.integer "ability_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["ability_id"], name: "index_skills_on_ability_id"
  end

  create_table "spell_components", id: false, force: :cascade do |t|
    t.integer "spell_id", null: false
    t.integer "item_id", null: false
  end

  create_table "spell_schools", force: :cascade do |t|
    t.string "name"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "spell_slots", force: :cascade do |t|
    t.integer "level"
    t.integer "slots"
  end

  create_table "spells", force: :cascade do |t|
    t.string "name"
    t.integer "level"
    t.integer "casting_time"
    t.integer "duration"
    t.integer "range"
    t.integer "spell_school_id"
    t.json "description"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["spell_school_id"], name: "index_spells_on_spell_school_id"
  end

  create_table "taggings", force: :cascade do |t|
    t.integer "tag_id"
    t.string "taggable_type"
    t.integer "taggable_id"
    t.string "tagger_type"
    t.integer "tagger_id"
    t.string "context", limit: 128
    t.datetime "created_at"
    t.index ["context"], name: "index_taggings_on_context"
    t.index ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_idx", unique: true
    t.index ["tag_id"], name: "index_taggings_on_tag_id"
    t.index ["taggable_id", "taggable_type", "context"], name: "taggings_taggable_context_idx"
    t.index ["taggable_id", "taggable_type", "tagger_id", "context"], name: "taggings_idy"
    t.index ["taggable_id"], name: "index_taggings_on_taggable_id"
    t.index ["taggable_type"], name: "index_taggings_on_taggable_type"
    t.index ["tagger_id", "tagger_type"], name: "index_taggings_on_tagger_id_and_tagger_type"
    t.index ["tagger_id"], name: "index_taggings_on_tagger_id"
  end

  create_table "tags", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer "taggings_count", default: 0
    t.index ["name"], name: "index_tags_on_name", unique: true
  end

  create_table "tilemap_layers", force: :cascade do |t|
    t.integer "tilemap_id"
    t.integer "tilemap_layer_id"
    t.string "name"
    t.integer "width"
    t.integer "height"
    t.string "properties"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["tilemap_id"], name: "index_tilemap_layers_on_tilemap_id"
    t.index ["tilemap_layer_id"], name: "index_tilemap_layers_on_tilemap_layer_id"
  end

  create_table "tilemap_objects", force: :cascade do |t|
    t.integer "tilemap_id"
    t.integer "tilemap_layer_id"
    t.string "name"
    t.integer "x"
    t.integer "y"
    t.integer "width"
    t.integer "height"
    t.string "properties"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index "\"tilemap\"", name: "index_tilemap_objects_on_tilemap"
    t.index ["tilemap_id"], name: "index_tilemap_objects_on_tilemap_id"
    t.index ["tilemap_layer_id"], name: "index_tilemap_objects_on_tilemap_layer_id"
  end

  create_table "tilemap_tiles", force: :cascade do |t|
    t.integer "tilemap_id"
    t.integer "tilemap_layer_id"
    t.integer "x"
    t.integer "y"
    t.integer "tilemap_tileset_id"
    t.integer "index"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index "\"tilemap\"", name: "index_tilemap_tiles_on_tilemap"
    t.index ["tilemap_id"], name: "index_tilemap_tiles_on_tilemap_id"
    t.index ["tilemap_layer_id"], name: "index_tilemap_tiles_on_tilemap_layer_id"
    t.index ["tilemap_tileset_id"], name: "index_tilemap_tiles_on_tilemap_tileset_id"
  end

  create_table "tilemap_tilesets", force: :cascade do |t|
    t.integer "tilemap_id"
    t.integer "tileset_id"
    t.string "source"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index "\"tilemap\"", name: "index_tilemap_tilesets_on_tilemap"
    t.index ["tilemap_id"], name: "index_tilemap_tilesets_on_tilemap_id"
    t.index ["tileset_id"], name: "index_tilemap_tilesets_on_tileset_id"
  end

  create_table "tilemaps", force: :cascade do |t|
    t.integer "user_id"
    t.string "name"
    t.string "description"
    t.string "orientation"
    t.integer "width"
    t.integer "height"
    t.integer "hexsidelength"
    t.string "staggeraxis"
    t.string "staggerindex"
    t.integer "tilewidth"
    t.integer "tileheight"
    t.string "properties"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index "\"user\"", name: "index_tilemaps_on_user"
    t.index ["user_id"], name: "index_tilemaps_on_user_id"
  end

  create_table "tileset_tiles", force: :cascade do |t|
    t.integer "tileset_id"
    t.integer "index"
    t.string "properties"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["tileset_id"], name: "index_tileset_tiles_on_tileset_id"
  end

  create_table "tilesets", force: :cascade do |t|
    t.integer "user_id"
    t.string "name"
    t.string "description"
    t.integer "margin"
    t.integer "spacing"
    t.integer "tilewidth"
    t.integer "tileheight"
    t.string "properties"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index "\"user\"", name: "index_tilesets_on_user"
    t.index ["user_id"], name: "index_tilesets_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "api_token", default: "token"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "provider"
    t.string "uid"
    t.string "token"
    t.integer "expires_at"
    t.boolean "expires"
    t.string "refresh_token"
    t.index ["api_token"], name: "index_users_on_api_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "character_class_levels", "character_classes"
  add_foreign_key "character_classes", "abilities"
  add_foreign_key "skills", "abilities"
  add_foreign_key "spells", "spell_schools"
  add_foreign_key "taggings", "tags"
  add_foreign_key "tilemap_layers", "tilemaps", on_delete: :cascade
  add_foreign_key "tilemap_objects", "tilemap_layers", on_delete: :cascade
  add_foreign_key "tilemap_objects", "tilemaps", on_delete: :cascade
  add_foreign_key "tilemap_tiles", "tilemap_layers", on_delete: :cascade
  add_foreign_key "tilemap_tiles", "tilemap_tilesets", on_delete: :cascade
  add_foreign_key "tilemap_tiles", "tilemaps", on_delete: :cascade
  add_foreign_key "tilemap_tilesets", "tilemaps", on_delete: :cascade
  add_foreign_key "tilemaps", "users", on_delete: :cascade
  add_foreign_key "tileset_tiles", "tilesets", on_delete: :cascade
  add_foreign_key "tilesets", "users", on_delete: :cascade
end
