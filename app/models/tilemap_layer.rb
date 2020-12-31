# == Schema Information
#
# Table name: tilemap_layers
#
#  id         :integer          not null, primary key
#  tilemap_id :integer
#  name       :string
#  width      :integer
#  height     :integer
#
class TilemapLayer < ApplicationRecord
  belongs_to :tilemap
  has_many :tilemap_tiles
end
