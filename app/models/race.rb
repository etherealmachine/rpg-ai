# == Schema Information
#
# Table name: races
#
#  id          :integer          not null, primary key
#  name        :string
#  description :json
#  size        :string
#  speed       :integer
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Race < ApplicationRecord
end
