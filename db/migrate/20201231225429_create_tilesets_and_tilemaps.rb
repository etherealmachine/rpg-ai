class CreateTilesetsAndTilemaps < ActiveRecord::Migration[6.1]
  def change
    create_table :tilesets do |t|
      t.belongs_to :user
      t.string :name
      t.string :description
      t.integer :margin
      t.integer :spacing
      t.integer :tilewidth
      t.integer :tileheight
      adapter_type = connection.adapter_name.downcase.to_sym
      t.jsonb :properties if adapter_type == :postgres
      t.string :properties if adapter_type == :sqlite 
      t.timestamps
    end
    add_foreign_key :tilesets, :users, on_delete: :cascade
    add_index :tilesets, :user
    create_table :tileset_tiles do |t|
      t.belongs_to :tileset
      t.integer :index
      adapter_type = connection.adapter_name.downcase.to_sym
      t.jsonb :properties if adapter_type == :postgres
      t.string :properties if adapter_type == :sqlite 
      t.timestamps
    end
    add_foreign_key :tileset_tiles, :tilesets, on_delete: :cascade
    create_table :tilemaps do |t|
      t.belongs_to :user
      t.string :name
      t.string :description
      t.string :orientation
      t.integer :width
      t.integer :height
      t.integer :hexsidelength
      t.string :staggeraxis
      t.string :staggerindex
      t.integer :tilewidth
      t.integer :tileheight
      adapter_type = connection.adapter_name.downcase.to_sym
      t.jsonb :properties if adapter_type == :postgres
      t.string :properties if adapter_type == :sqlite 
      t.timestamps
    end
    add_foreign_key :tilemaps, :users, on_delete: :cascade
    add_index :tilemaps, :user
    create_table :tilemap_tilesets do |t|
      t.belongs_to :tilemap
      t.references :tileset
      t.string :source
    end
    add_foreign_key :tilemap_tilesets, :tilemaps, on_delete: :cascade
    add_index :tilemap_tilesets, :tilemap
    create_table :tilemap_layers do |t|
      t.belongs_to :tilemap
      t.string :name
      t.integer :width
      t.integer :height
    end
    add_foreign_key :tilemap_layers, :tilemaps, on_delete: :cascade
    create_table :tilemap_tiles do |t|
      t.belongs_to :tilemap
      t.references :tilemap_layer
      t.integer :x
      t.integer :y
      t.references :tilemap_tileset
      t.integer :index
      t.timestamps
    end
    add_foreign_key :tilemap_tiles, :tilemaps, on_delete: :cascade
    add_foreign_key :tilemap_tiles, :tilemap_layers, on_delete: :cascade
    add_foreign_key :tilemap_tiles, :tilemap_tilesets, on_delete: :cascade
    add_index :tilemap_tiles, :tilemap
    create_table :tilemap_objects do |t|
      t.belongs_to :tilemap
      t.references :tilemap_layer
      t.string :name
      t.integer :x
      t.integer :y
      t.integer :width
      t.integer :height
      adapter_type = connection.adapter_name.downcase.to_sym
      t.jsonb :properties if adapter_type == :postgres
      t.string :properties if adapter_type == :sqlite 
      t.timestamps
    end
    add_foreign_key :tilemap_objects, :tilemaps, on_delete: :cascade
    add_foreign_key :tilemap_objects, :tilemap_layers, on_delete: :cascade
    add_index :tilemap_objects, :tilemap
  end
end
