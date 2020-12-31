# == Schema Information
#
# Table name: tilemap_tilesets
#
#  id         :integer          not null, primary key
#  tilemap_id :integer
#  tileset_id :integer
#  source     :string
#
class TilemapTileset < ApplicationRecord
  belongs_to :tilemap
  belongs_to :tileset, optional: true

  after_update :update_tilemap_thumbnail

  def update_tilemap_thumbnail
    if tilemap.tilesets.all? { |tileset| tileset.tileset.present? }
      tilemap.thumbnail.attach(io: StringIO.new(tilemap.as_image.to_blob), filename: 'thumbnail.png')
    end
  end
end
