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
#  properties  :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Tileset < ApplicationRecord
  belongs_to :user
  has_one_attached :image
  has_one_attached :definition
  has_many :tiles, class_name: TilesetTile.name
  acts_as_taggable_on :tags

  def from_files!(files)
    tiles = []
    files.each do |file|
      case file.content_type
      when "application/octet-stream", "application/xml"
        definition = Nokogiri::XML(file)
        ts = definition.xpath('tileset').first
        self.name = ts["name"] || File.basename(file.original_filename)
        self.tilewidth = ts["tilewidth"].to_i
        self.tileheight = ts["tileheight"].to_i
        self.margin = ts["margin"].to_i || 0
        self.spacing = ts["spacing"].to_i || 0
        self.properties = JSON.generate(Hash[ts.xpath('properties/property').map { |prop| [prop['name'], prop['value']] }])
        ts.xpath('tile').each do |tile_def|
          tiles << tile_def
        end
        self.definition = file
      when "image/png"
        self.image = file
      when "image/png;base64"
        self.image.attach(
          io: StringIO.new(Base64.decode64(file.read)),
          filename: file.original_filename,
          content_type: 'image/png',
        )
      else
        raise "Can't handle #{file.original_filename} with content type #{file.content_type}"
      end
    end
    raise "No image attached" unless self.image.attached?
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
    unless image.analyzed?
      AnalyzeImageJob.perform_later(self, :image)
      raise 'image not yet analyzed'
    end
    @columns ||= (image.metadata[:width] - margin * 2) / (tilewidth + spacing).to_f
  end

  def rows
    unless image.analyzed?
      AnalyzeImageJob.perform_later(self, :image)
      raise 'image not yet analyzed'
    end
    @rows ||= (image.metadata[:height] - margin * 2) / (tileheight + spacing).to_f
  end

  include Rails.application.routes.url_helpers

  def as_json(options={})
    {
      columns: columns,
      image: rails_blob_url(image),
      imageheight: image.metadata[:width],
      imagewidth: image.metadata[:height],
      margin: margin,
      name: name,
      spacing: spacing,
      tilecount: columns*rows,
      tiledversion: "1.4.3",
      tileheight: tilewidth,
      tilewidth: tileheight,
      type: "tileset",
      version: "1.2",
      properties: JSON.parse(properties).map { |k, v| { name: k, value: v } },
    }
  end

end
