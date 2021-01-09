# == Schema Information
#
# Table name: tilemaps
#
#  id          :integer          not null, primary key
#  user_id     :integer
#  name        :string
#  description :string
#  orientation :string
#  width       :integer
#  height      :integer
#  tilewidth   :integer
#  tileheight  :integer
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Tilemap < ApplicationRecord
  belongs_to :user
  has_many :tilesets, class_name: TilemapTileset.name
  has_many :tilemap_layers
  has_one_attached :thumbnail
  has_many :tiles, class_name: TilemapTile.name
  acts_as_taggable_on :tags

  include Rails.application.routes.url_helpers

  def as_json(options={})
    {
      id: id,
      type: "map",
      version: "1.2",
      tiledversion: "1.4.3",
      width: width,
      height: height,
      tilewidth: tilewidth,
      tileheight: tileheight,
      compressionlevel: -1,
      infinite: false,
      tilesets: tilesets.filter { |tileset| tileset.tileset.present? }.map do |tileset|
        {
          type: "tileset",
          version: "1.2",
          tiledversion: "1.4.3",
          name: tileset.tileset.name,
          firstgid: firstgid_map[tileset.id],
          image: rails_blob_url(tileset.tileset.image),
          imagewidth: tileset.tileset.image.metadata[:width],
          imageheight: tileset.tileset.image.metadata[:height],
          margin: tileset.tileset.margin,
          spacing: tileset.tileset.spacing,
          tilewidth: tileset.tileset.tilewidth,
          tileheight: tileset.tileset.tileheight,
          tiles: tileset.tileset.tiles.map do |tile|
            {
              id: tile.index,
              properties: JSON.parse(tile.properties).map { |k, v| { name: k, value: v } },
            }
          end,
        }
      end,
      layers: tilemap_layers.each_with_index.map do |tilemap_layer, i|
        {
          type: 'tilelayer',
          id: i,
          name: tilemap_layer.name,
          width: tilemap_layer.width,
          height: tilemap_layer.height,
          x: 0,
          y: 0,
          opacity: 1,
          data: tiles_for_layer(tilemap_layer).flatten,
        }
      end,
      nextlayerid: tilemap_layers.count,
      nextobjectid: 0,
      orientation: "orthogonal",
      properties: [],
      renderorder: "right-down",
    }
  end

  def as_xml
    Nokogiri::XML(Nokogiri::XML::Builder.new(encoding: 'UTF-8') do |root|
      root.map(
        version: "1.2",
        tiledversion: "1.4.3",
        orientation: "orthogonal",
        renderorder: "right-down",
        width: width,
        height: height,
        tilewidth: tilewidth,
        tileheight: tileheight,
        infinite: 0,
        nextlayerid: tilemap_layers.count,
        nextobjectid: 1,
      ) do |map|
        firstgid_map.each do |tileset_id, firstgid|
          ts = tilesets.find(tileset_id)
          map.tileset(firstgid: firstgid, source: ts.source) do |tileset|
            map.tiles do |tiles|
              ts.tileset.tiles.each do |t|
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
        tilemap_layers.each do |tilemap_layer|
          map.layer(
              id: tilemap_layer.id-1,
              name: tilemap_layer.name,
              width: tilemap_layer.width,
              height: tilemap_layer.height,
              x: 0, y: 0, opacity: 1) do |layer|
            layer.data(encoding: "csv") do |data|
              data.text(tiles_for_layer(tilemap_layer).map { |row| row.join(',') }.join('\n'))
            end
          end
        end
      end
    end.to_xml)
  end

  def firstgid_map
    @firstgid_map ||= begin
      firstgid = 1
      firstgid_map = {}
      tilesets.filter { |tileset| tileset.tileset.present? }.each do |tileset|
        firstgid_map[tileset.id] = firstgid
        firstgid += tileset.tileset.columns * tileset.tileset.rows
      end
      firstgid_map
    end
  end

  def tiles_for_layer(tilemap_layer)
    layer_tiles = tiles.includes(:tilemap_tileset).where(tilemap_layer: tilemap_layer).to_a.group_by { |tile| [tile.x, tile.y] }
    (0..tilemap_layer.height-1).map do |y|
      (0..tilemap_layer.width-1).map do |x|
        tile = layer_tiles[[x, y]]&.first
        if tile.nil?
          0
        else
          tile.index + firstgid_map[tile.tilemap_tileset.id]
        end
      end
    end
  end

  def as_image
    png = ChunkyPNG::Image.new(width*tilewidth, height*tileheight, ChunkyPNG::Color::TRANSPARENT)

    pngs_for_tileset = Hash[tilesets.map do |tileset|
      [
        tileset.id,
        ChunkyPNG::Image.from_blob(tileset.tileset.image.blob.download)
      ]
    end]

    minx, miny, maxx, maxy = [Float::INFINITY, Float::INFINITY, 0, 0]
    tilemap_layers.order(:id, :asc).each_with_index.map do |tilemap_layer, i|
      tiles.includes(:tilemap_tileset).where(tilemap_layer: tilemap_layer).each do |tile|
        tileset_png = pngs_for_tileset[tile.tilemap_tileset.id]
        ts = tile.tilemap_tileset.tileset
        w = ts.tilewidth
        h = ts.tileheight
        (0..w-1).each do |x|
          (0..h-1).each do |y|
            mx, my = [tile.x*w+x, tile.y*h+y]
            minx, miny = [[minx, mx].min, [miny, my].min]
            maxx, maxy = [[maxx, mx].max, [maxy, my].max]
            tx = (tile.index % ts.columns) * (w+ts.spacing) + x + ts.margin
            ty = (tile.index / ts.columns) * (h+ts.spacing) + y + ts.margin
            png[mx,my] = ChunkyPNG::Color.compose(
              tileset_png[tx,ty],
              png[mx,my],
            )
          end
        end
      end
    end
    png.crop!(minx, miny, maxx-minx, maxy-miny)
    png
  end

end
