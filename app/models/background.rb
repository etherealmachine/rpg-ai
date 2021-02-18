# == Schema Information
#
# Table name: backgrounds
#
#  id            :integer          not null, primary key
#  name          :string
#  source_id     :integer
#  description   :json
#  proficiencies :json
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class Background < ApplicationRecord
  belongs_to :source
end
