# == Schema Information
#
# Table name: monsters
#
#  id                 :integer          not null, primary key
#  name               :string
#  description        :json
#  challenge_rating   :integer
#  armor_class        :integer
#  hit_points         :string
#  passive_perception :integer
#  size               :string
#  speed              :integer
#  alignment          :string
#  types              :json
#  languages          :json
#  abilities          :json
#  skills             :json
#  senses             :json
#  saves              :json
#  resistances        :json
#  vulnerabilities    :json
#  immunities         :json
#  traits             :json
#  actions            :json
#  reactions          :json
#  legendaries        :json
#  spell_slots        :json
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
class Monster < ApplicationRecord
  has_and_belongs_to_many :spells

  def spells_by_level
    spells.group_by(&:level)
  end
end
