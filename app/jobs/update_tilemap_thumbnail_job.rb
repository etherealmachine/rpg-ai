class UpdateTilemapThumbnailJob < ApplicationJob
  queue_as :default

  def perform(tilemap)
    if tilemap.tilesets.all? { |tileset| tileset.tileset.present? }
      tilemap.tilesets.each do |tileset|
        tileset.tileset.image.analyzed unless tileset.tileset.image.analyzed?
      end
      tilemap.thumbnail.attach(io: StringIO.new(tilemap.as_image.to_blob), filename: 'thumbnail.png')
    end
  end
end