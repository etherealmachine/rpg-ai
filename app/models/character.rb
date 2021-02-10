# == Schema Information
#
# Table name: characters
#
#  id            :integer          not null, primary key
#  name          :string
#  initiative    :integer
#  hit_points    :integer
#  conditions    :json
#  monster_id    :integer
#  race_id       :integer
#  background_id :integer
#  proficiencies :json
#  alignment     :string
#  abilities     :json
#  spell_slots   :json
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class Character < ApplicationRecord
  belongs_to :race, optional: true
  belongs_to :background, optional: true
  belongs_to :monster, optional: true
  has_many :levels, class_name: CharacterLevel.name
  has_many :spells, class_name: CharacterSpell.name
  has_many :items, class_name: CharacterEquipment.name
  has_many :feats, class_name: CharacterFeat.name

  def roll_initiative!
    if abilities.present?
      dex = abilities["dex"]
    elsif monster.present?
      dex = monster.abilities["dex"]
    end
    return if dex.nil?
    self.initiative = rand(1..20) + ((dex - 10) / 2).floor
    save!
  end
end
