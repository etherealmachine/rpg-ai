class CreateCharacter < ActiveRecord::Migration[6.1]
  def change
    create_table :characters do |t|
      t.string :name
      t.references :user
      t.integer :initiative
      t.integer :hit_points
      t.decimal :gold
      t.json :conditions
      t.references :monster
      t.references :race
      t.references :background
      t.json :proficiencies
      t.string :alignment
      t.json :abilities
      t.json :spell_slots
      t.timestamps
    end
    create_join_table :characters, :character_classes, table_name: :character_levels do |t|
      t.integer :level
    end
    create_join_table :characters, :feats, table_name: :character_feats do |t|
      t.integer :level
    end
    create_join_table :characters, :items, table_name: :character_equipment do |t|
      t.boolean :equipped
      t.integer :charges
      t.json :notes
    end
    create_join_table :characters, :spells, table_name: :character_spells do |t|
      t.boolean :memorized
    end
  end
end
