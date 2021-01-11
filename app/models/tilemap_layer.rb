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
  has_many :tilemap_objects

  def as_json(options={})
    {
      type: layer_type,
      id: id,
      name: name,
      width: width,
      height: height,
      x: 0,
      y: 0,
      opacity: 1,
      data: tiledata.flatten,
      objects: tilemap_objects,
    }
  end

  def layer_type
    is_tilelayer? ? 'tilelayer' : 'objectgroup'
  end

  def is_tilelayer?
    tiledata.any?
  end

  def is_objectlayer?
    tilemap_objects.any?
  end

  def as_xml(frag)
    if is_tilelayer?
      frag.layer(
        id: id,
        name: name,
        width: width,
        height: height,
        x: 0,
        y: 0,
        opacity: 1,
      ) do |layer|
        layer.data(encoding: "csv") do |data|
          data.text(tiledata.map { |row| row.join(',') }.join('\n'))
        end
      end
    elsif is_objectlayer?
      frag.objectgroup(
        id: id,
        name: name,
      ) do |objgroup|
        tilemap_objects.each do |obj|
          obj.as_xml(objgroup)
        end
      end
    end
  end

  def tiledata
    @tiledata ||= begin
      layer_tiles = tilemap_tiles.includes(:tilemap_tileset).to_a.group_by { |tile| [tile.x, tile.y] }
      if layer_tiles.empty? || height.nil? || width.nil?
        []
      else
        (0..height-1).map do |y|
          (0..width-1).map do |x|
            tile = layer_tiles[[x, y]]&.first
            if tile.nil?
              0
            else
              tile.index + tilemap.firstgid_map[tile.tilemap_tileset.tileset.id]
            end
          end
        end
      end
    end
  end

end
