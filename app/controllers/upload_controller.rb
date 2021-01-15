class UploadController < ApplicationController
  before_action :authenticate_user!

  def upload 
    files = params.require(:files).values

    tilemap_files = files.filter { |file| ['application/octet-stream', 'application/xml'].include?(file.content_type) && file.original_filename.ends_with?('.tmx') }
    tileset_files = files.filter { |file| ['application/octet-stream', 'application/xml'].include?(file.content_type) && file.original_filename.ends_with?('.tsx') }
    tileset_images = files.filter { |file| ['image/png', 'image/png;base64'].include?(file.content_type) }

    tilemaps = tilemap_files.map do |tilemap_file|
      tilemap = Tilemap.where(user: current_user).
        with_attached_definition.
        references(:attachment_definition).
        where(ActiveStorage::Blob.arel_table[:filename].matches(tilemap_file.original_filename))&.first
      if tilemap.nil?
        tilemap = Tilemap.new(user: current_user)
      end
      tilemap.from_file!(tilemap_file)
      tilemap.tilesets.each do |tilemap_tileset|
        tileset_file = tileset_files.find { |file| file.original_filename == tilemap_tileset.source }
        source = Nokogiri::XML(tileset_file).xpath('tileset/image').first['source']
        tileset_file.rewind
        tileset_image = tileset_images.find { |file| file.original_filename == source }
        tileset = Tileset.where(user: current_user).
          with_attached_definition.
          references(:attachment_definition).
          where(ActiveStorage::Blob.arel_table[:filename].matches(tileset_file.original_filename))&.first
        if tileset.nil?
          tileset = Tileset.new(user: current_user)
        end
        tileset.from_files!([tileset_file, tileset_image])
        tilemap_tileset.tileset = tileset
        tilemap_tileset.save!
      end
      tilemap
    end

    tilesets = tileset_files.map do |tileset_file|
      tileset_file.rewind
      tileset = Tileset.where(user: current_user).
        with_attached_definition.
        references(:attachment_definition).
        where(ActiveStorage::Blob.arel_table[:filename].matches(tileset_file.original_filename))&.first
      source = Nokogiri::XML(tileset_file).xpath('tileset/image').first['source']
      tileset_file.rewind
      tileset_image = tileset_images.find { |file| file.original_filename == source }
      tileset_image.rewind
      if tileset.nil?
        tileset = Tileset.new(user: current_user)
      end
      tileset.from_files!([tileset_file, tileset_image])
    end

    tilemaps.each do |tilemap|
      UpdateTilemapThumbnailJob.perform_later(tilemap)
    end

    return render json: {
      tilemaps: tilemaps.count,
      tilesets: tilesets.count,
    }
  end

end

