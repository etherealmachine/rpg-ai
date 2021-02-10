# == Schema Information
#
# Table name: character_levels
#
#  character_id       :integer          not null
#  character_class_id :integer          not null
#  level              :integer
#
class CharacterLevel < ApplicationRecord
  belongs_to :character
  belongs_to :character_class
end
