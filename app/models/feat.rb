# == Schema Information
#
# Table name: feats
#
#  id           :integer          not null, primary key
#  name         :string
#  prerequisite :string
#  description  :json
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
class Feat < ApplicationRecord
end
