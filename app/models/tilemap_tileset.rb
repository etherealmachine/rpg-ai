# == Schema Information
#
# Table name: tilemap_tilesets
#
#  id         :integer          not null, primary key
#  tilemap_id :integer
#  tileset_id :integer
#  source     :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class TilemapTileset < ApplicationRecord
  belongs_to :tilemap
  belongs_to :tileset, optional: true

  include Rails.application.routes.url_helpers

  def as_json(options={})
    {
      type: "tileset",
      version: "1.2",
      tiledversion: "1.4.3",
      name: tileset.name,
      firstgid: tilemap.firstgid_map[tileset.id].to_i,
      image: rails_blob_url(tileset.image),
      imagewidth: tileset.image.metadata[:width],
      imageheight: tileset.image.metadata[:height],
      margin: tileset.margin,
      spacing: tileset.spacing,
      tilewidth: tileset.tilewidth,
      tileheight: tileset.tileheight,
      tiles: tileset.tiles.map do |tile|
        {
          id: tile.index,
          properties: JSON.parse(tile.properties).map { |k, v| { name: k, value: v } },
        }
      end,
    }
  end

  def as_xml(frag)
    frag.tiles do |tiles|
      self.tileset.tiles.each do |t|
        tiles.tile(id: t.index) do |tile|
          tile.properties do |props|
            JSON.parse(t.properties).each do |k, v|
              props.property(name: k, value: v)
            end
          end
        end
      end
    end
  end

end
