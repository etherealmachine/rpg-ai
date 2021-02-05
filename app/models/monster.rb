# == Schema Information
#
# Table name: monsters
#
#  id                 :integer          not null, primary key
#  name               :string
#  challenge_rating   :integer
#  armor_class        :integer
#  hit_points         :string
#  passive_perception :integer
#  size               :string
#  speed              :integer
#  alignment          :string
#  languages          :json
#  abilities          :json
#  saves              :json
#  spells             :json
#  resist             :json
#  vulnerable         :json
#  immune             :json
#  description        :json
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
class Monster < ApplicationRecord
end
