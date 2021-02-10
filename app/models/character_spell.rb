# == Schema Information
#
# Table name: character_spells
#
#  character_id :integer          not null
#  spell_id     :integer          not null
#  memorized    :boolean
#
class CharacterSpell < ApplicationRecord
  belongs_to :character
  belongs_to :spell
end
