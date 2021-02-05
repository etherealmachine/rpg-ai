# == Schema Information
#
# Table name: backgrounds
#
#  id            :integer          not null, primary key
#  name          :string
#  description   :json
#  proficiencies :json
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class Background < ApplicationRecord
end
