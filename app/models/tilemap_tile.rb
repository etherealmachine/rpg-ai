# == Schema Information
#
# Table name: tilemap_tiles
#
#  id                 :integer          not null, primary key
#  tilemap_id         :integer
#  tilemap_layer_id   :integer
#  x                  :integer
#  y                  :integer
#  tilemap_tileset_id :integer
#  index              :integer
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
class TilemapTile < ApplicationRecord
  belongs_to :tilemap
  belongs_to :tilemap_tileset
  belongs_to :tilemap_layer
end
