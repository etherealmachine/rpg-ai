# == Schema Information
#
# Table name: tilesets
#
#  id          :integer          not null, primary key
#  user_id     :integer
#  name        :string
#  description :string
#  margin      :integer
#  spacing     :integer
#  tilewidth   :integer
#  tileheight  :integer
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Tileset < ApplicationRecord
  belongs_to :user
  has_one_attached :image
  has_many :tiles, class_name: TilesetTile.name
  acts_as_taggable_on :tags

  def from_files!(files)
    tiles = []
    files.each do |file|
      case file.content_type
      when "application/octet-stream"
        definition = Nokogiri::XML(file)
        ts = definition.xpath('tileset').first
        self.name = ts["name"] || File.basename(file.original_filename)
        self.tilewidth = ts["tilewidth"].to_i
        self.tileheight = ts["tileheight"].to_i
        self.margin = ts["margin"].to_i || 0
        self.spacing = ts["spacing"].to_i || 0
        ts.xpath('tile').each do |tile_def|
          tiles << tile_def
        end
      when "image/png"
        self.image = file
      else
        raise "Can't handle #{file.original_filename} with content type #{file.content_type}"
      end
    end
    raise "No image attached" unless self.image.present?
    Tileset.transaction do
      self.save!
      TilesetTile.insert_all!(tiles.map do |tile|
        props = Hash[tile.xpath('properties/property').map { |prop| [prop['name'], prop['value']] }]
        {
          tileset_id: self.id,
          index: tile['id'],
          properties: JSON.generate(props),
          created_at: Time.now,
          updated_at: Time.now,
        }
      end) if tiles.any?
    end
  end

  def columns
    ((image.metadata[:width] - margin) + spacing) / (tilewidth + spacing)
  end

  def rows
    ((image.metadata[:height] - margin) + spacing) / (tileheight + spacing)
  end

  include Rails.application.routes.url_helpers

  def as_json(options={})
    {
      "columns": columns,
      "image": rails_blob_url(image),
      "imageheight": image.metadata[:width],
      "imagewidth": image.metadata[:height],
      "margin": margin,
      "name": name,
      "spacing": spacing,
      "tilecount": columns*rows,
      "tiledversion": "1.4.3",
      "tileheight": tilewidth,
      "tilewidth": tileheight,
      "type": "tileset",
      "version": "1.2",
    }
  end

end
