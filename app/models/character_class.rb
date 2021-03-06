# == Schema Information
#
# Table name: character_classes
#
#  id            :integer          not null, primary key
#  name          :string
#  source_id     :integer
#  hit_die       :integer
#  proficiencies :json
#  spell_ability :string
#  levels        :json
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class CharacterClass < ApplicationRecord
  belongs_to :source
end
