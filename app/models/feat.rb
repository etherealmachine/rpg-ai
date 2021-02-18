# == Schema Information
#
# Table name: feats
#
#  id           :integer          not null, primary key
#  name         :string
#  source_id    :integer
#  prerequisite :string
#  description  :json
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
class Feat < ApplicationRecord
  belongs_to :source
end
