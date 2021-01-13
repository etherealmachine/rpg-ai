# == Schema Information
#
# Table name: tilemaps
#
#  id            :integer          not null, primary key
#  user_id       :integer
#  name          :string
#  description   :string
#  orientation   :string
#  width         :integer
#  height        :integer
#  hexsidelength :integer
#  staggeraxis   :string
#  staggerindex  :string
#  tilewidth     :integer
#  tileheight    :integer
#  properties    :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
class Tilemap < ApplicationRecord
  belongs_to :user
  has_many :tilesets, class_name: TilemapTileset.name
  has_many :tilemap_layers
  has_one_attached :thumbnail
  has_one_attached :definition
  has_many :tiles, class_name: TilemapTile.name
  has_many :objects, class_name: TilemapObject.name
  acts_as_taggable_on :tags

  def from_file!(file)
    tilesets.destroy_all
    tilemap_layers.destroy_all
    tiles.destroy_all
    Tilemap.transaction do
      unless ['application/octet-stream', 'application/xml'].include?(file.content_type)
        raise "Can't handle #{file.original_filename} with content type #{file.content_type}"
      end
      definition = Nokogiri::XML(file)
      map = definition.xpath("map").first
      self.name = map["name"] || File.basename(file.original_filename)
      self.width = map["width"]
      self.height = map["height"]
      self.tilewidth = map["tilewidth"]
      self.tileheight = map["tileheight"]
      self.orientation = map["orientation"]
      self.hexsidelength = map["hexsidelength"]
      self.staggeraxis = map["staggeraxis"]
      self.staggerindex = map["staggerindex"]
      self.properties = JSON.generate(Hash[map.xpath('properties/property').map { |prop| [prop['name'], prop['value']] }])
      self.definition = file
      self.save!
      tilesets = map.xpath("tileset").map do |tileset|
        tilemap_tileset = TilemapTileset.new(
          tilemap: self,
          source: File.basename(tileset["source"]))
        tilemap_tileset.save!
        { firstgid: tileset["firstgid"].to_i, tilemap_tileset: tilemap_tileset }
      end
      tiles = map.xpath("layer").each.map do |layer|
        tile_ids = layer.text.split(',').map { |tile_id| tile_id.strip.to_i }
        name, width, height = layer["name"], layer["width"].to_i, layer["height"].to_i
        layer = TilemapLayer.new(tilemap: self, name: name, width: width, height: height)
        layer.save!
        tile_ids.each_with_index.map do |tileset_index, tilemap_index|
          next if tileset_index == 0
          gidindex = tilesets.find_index { |tileset| tileset_index < tileset[:firstgid] }
          gidindex = gidindex.nil? ? tilesets.count - 1 : gidindex - 1
          tileset = tilesets[gidindex]
          {
            tilemap_id: id,
            tilemap_layer_id: layer.id,
            x: tilemap_index % width,
            y: tilemap_index / width,
            tilemap_tileset_id: tileset[:tilemap_tileset].id,
            index: tileset_index - tileset[:firstgid],
            created_at: Time.now,
            updated_at: Time.now,
          }
        end.flatten
      end.flatten.filter { |t| t.present? }
      TilemapTile.insert_all!(tiles)
      objects = map.xpath("objectgroup").each.map do |objectgroup|
        layer = TilemapLayer.new(tilemap: self, name: objectgroup["name"])
        layer.save!
        objectgroup.xpath("object").each.map do |obj|
          {
            tilemap_id: id,
            tilemap_layer_id: layer.id,
            x: obj["x"],
            y: obj["y"],
            width: obj["width"],
            height: obj["height"],
            properties: JSON.generate(Hash[obj.xpath('properties/property').map { |prop| [prop['name'], prop['value']] }]),
            created_at: Time.now,
            updated_at: Time.now,
          }
        end.flatten
      end.flatten
      TilemapObject.insert_all!(objects)
    end
    self.reload
  end

  include Rails.application.routes.url_helpers

  def as_json(options={})
    {
      id: id,
      type: "map",
      version: "1.2",
      tiledversion: "1.4.3",
      renderorder: "right-down",
      width: width,
      height: height,
      infinite: 0,
      tilewidth: tilewidth,
      tileheight: tileheight,
      compressionlevel: -1,
      infinite: false,
      tilesets: tilesets,
      layers: tilemap_layers,
      nextlayerid: tilemap_layers.count,
      orientation: orientation,
      hexsidelength: hexsidelength,
      staggeraxis: staggeraxis,
      staggerindex: staggerindex,
      properties: JSON.parse(properties).map { |k, v| { name: k, value: v } },
    }
  end

  def as_xml
    Nokogiri::XML(Nokogiri::XML::Builder.new(encoding: 'UTF-8') do |root|
      root.map(
        version: "1.2",
        tiledversion: "1.4.3",
        renderorder: "right-down",
        width: width,
        height: height,
        infinite: 0,
        tilewidth: tilewidth,
        tileheight: tileheight,
        orientation: orientation,
        hexsidelength: hexsidelength,
        staggeraxis: staggeraxis,
        staggerindex: staggerindex,
        nextlayerid: tilemap_layers.count,
        nextobjectid: 1,
      ) do |map|
        firstgid_map.each do |tileset_id, firstgid|
          ts = tilesets.find(tileset_id)
          map.tileset(firstgid: firstgid, source: ts.source) do |tileset|
            ts.as_xml(tileset)
          end
        end
        tilemap_layers.filter { |layer| layer.is_tilelayer? }.each do |tilemap_layer|
          tilemap_layer.as_xml(map)
        end
        tilemap_layers.filter { |layer| layer.is_objectlayer? }.each do |tilemap_layer|
          tilemap_layer.as_xml(map)
        end
      end
    end.to_xml)
  end

  def firstgid_map
    @firstgid_map ||= begin
      firstgid = 1
      map = {}
      tilesets.filter { |tileset| tileset.tileset.present? }.each do |tileset|
        map[tileset.tileset.id] = firstgid
        firstgid += tileset.tileset.columns * tileset.tileset.rows
      end
      map
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
