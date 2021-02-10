# == Schema Information
#
# Table name: character_equipment
#
#  character_id :integer          not null
#  item_id      :integer          not null
#  equipped     :boolean
#  charges      :integer
#  notes        :json
#
class CharacterEquipment < ApplicationRecord
  self.table_name = "character_equipment"

  belongs_to :character
  belongs_to :item
end
