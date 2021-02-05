# == Schema Information
#
# Table name: items
#
#  id          :integer          not null, primary key
#  name        :string
#  magical     :boolean
#  attunement  :boolean
#  rarity      :string
#  range       :integer
#  damage      :string
#  value       :decimal(, )
#  weight      :decimal(, )
#  armor_class :integer
#  damage_type :string
#  description :json
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Item < ApplicationRecord
  has_and_belongs_to_many :damage_types
end
