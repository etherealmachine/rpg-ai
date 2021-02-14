# == Schema Information
#
# Table name: items
#
#  id          :integer          not null, primary key
#  name        :string
#  magical     :boolean
#  attunement  :boolean
#  stealth     :boolean
#  rarity      :string
#  range       :integer
#  strength    :integer
#  damage      :string
#  damage_2    :string
#  value       :decimal(, )
#  weight      :decimal(, )
#  armor_class :integer
#  damage_type :string
#  description :json
#  properties  :json
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Item < ApplicationRecord
end
