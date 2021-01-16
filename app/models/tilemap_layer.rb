# == Schema Information
#
# Table name: tilemap_layers
#
#  id               :integer          not null, primary key
#  tilemap_id       :integer
#  tilemap_layer_id :integer
#  name             :string
#  width            :integer
#  height           :integer
#  properties       :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
class TilemapLayer < ApplicationRecord
  belongs_to :tilemap
  belongs_to :tilemap_layer, optional: true
  has_many :tilemap_layers
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
      layers: tilemap_layers,
    }
  end

  def layer_type
    if tilemap_layers.any?
      'group'
    elsif tilemap_objects.any?
      'objectgroup'
    else
      'tilelayer'
    end
  end

  def as_xml(frag)
    if tilemap_layers.any?
      frag.group(
        id: id,
        name: name,
      ) do |group|
        tilemap_layers.each do |tilemap_layer|
          tilemap_layer.as_xml(group)
        end
      end
    end
    if tiledata.any?
      frag.layer(
        id: id,
        name: name,
        width: width,
        height: height,
        x: 0,
        y: 0,
      ) do |layer|
        layer.data(encoding: "csv") do |data|
          data.text(tiledata.map { |row| row.join(',') }.join('\n'))
        end
      end
    end
    if tilemap_objects.any?
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
            if tile.nil? || tile.tilemap_tileset.tileset.nil?
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
