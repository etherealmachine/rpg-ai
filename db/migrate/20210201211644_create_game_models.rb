class CreateGameModels < ActiveRecord::Migration[6.1]
  def change
    create_table :feats do |t|
      t.string :name
      t.string :prerequisite
      t.json :description
      t.timestamps
    end
    create_table :backgrounds do |t|
      t.string :name
      t.json :description
      t.json :proficiencies
      t.timestamps
    end
    create_table :items do |t|
      t.string :name
      t.boolean :magical
      t.boolean :attunement
      t.boolean :stealth
      t.string :rarity
      t.integer :range
      t.integer :range_2
      t.integer :strength
      t.string :damage
      t.string :damage_2
      t.decimal :value
      t.decimal :weight
      t.integer :armor_class
      t.string :damage_type
      t.json :description
      t.json :properties
      t.timestamps
    end
    create_table :races do |t|
      t.string :name
      t.json :traits
      t.json :abilities
      t.json :proficiencies
      t.string :size
      t.integer :speed
      t.timestamps
    end
    create_table :character_classes do |t|
      t.string :name
      t.integer :hit_die
      t.json :proficiencies
      t.string :spell_ability
      t.json :levels
      t.timestamps
    end
    create_table :spells do |t|
      t.string :name
      t.integer :level
      t.string :casting_time
      t.string :duration
      t.string :range
      t.string :components
      t.json :classes
      t.string :school
      t.boolean :ritual
      t.json :description
      t.timestamps
    end
    create_table :monsters do |t|
      t.string :name
      t.json :description
      t.decimal :challenge_rating
      t.integer :armor_class
      t.string :armor_description
      t.string :hit_points
      t.integer :passive_perception
      t.string :size
      t.integer :speed
      t.string :alignment
      t.json :types
      t.json :languages
      t.json :abilities
      t.json :skills
      t.json :senses
      t.json :saves
      t.json :resistances
      t.json :vulnerabilities
      t.json :immunities
      t.json :traits
      t.json :actions
      t.json :reactions
      t.json :legendaries
      t.json :spell_slots
      t.timestamps
    end
    create_join_table :monsters, :spells
  end
end