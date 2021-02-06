# == Schema Information
#
# Table name: spells
#
#  id           :integer          not null, primary key
#  name         :string
#  level        :integer
#  casting_time :string
#  duration     :string
#  range        :string
#  components   :string
#  classes      :string
#  school       :string
#  ritual       :boolean
#  description  :json
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
class Spell < ApplicationRecord
end
