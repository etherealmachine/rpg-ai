# == Schema Information
#
# Table name: character_classes
#
#  id            :integer          not null, primary key
#  name          :string
#  description   :json
#  hit_die       :integer
#  abilities     :json
#  proficiencies :json
#  levels        :json
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class CharacterClass < ApplicationRecord
end
