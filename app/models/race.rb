# == Schema Information
#
# Table name: races
#
#  id            :integer          not null, primary key
#  name          :string
#  source_id     :integer
#  traits        :json
#  abilities     :json
#  proficiencies :json
#  size          :string
#  speed         :integer
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class Race < ApplicationRecord
  belongs_to :source
end
