# == Schema Information
#
# Table name: tileset_tiles
#
#  id         :integer          not null, primary key
#  tileset_id :integer
#  index      :integer
#  properties :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class TilesetTile < ApplicationRecord
  belongs_to :tileset
end

