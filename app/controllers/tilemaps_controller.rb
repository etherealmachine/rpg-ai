class TilemapsController < ApplicationController
  before_action :authenticate_user!, except: [:show]

  def create
    file = params.require(:tilemap).require(:file)
    @tilemap = Tilemap.new(user: current_user)
    Tilemap.transaction do
      if file.content_type != "application/octet-stream"
        raise "Can't handle #{file.original_filename} with content type #{file.content_type}"
      end
      definition = Nokogiri::XML(file)
      map = definition.xpath("map").first
      @tilemap.name = map["name"] || file.original_filename
      @tilemap.orientation = map["orientation"]
      @tilemap.width = map["width"]
      @tilemap.height = map["height"]
      @tilemap.tilewidth = map["tilewidth"]
      @tilemap.tileheight = map["tileheight"]
      @tilemap.save!
      tilesets = map.xpath("tileset").map do |tileset|
        tilemap_tileset = TilemapTileset.new(
          tilemap: @tilemap,
          source: File.basename(tileset["source"]))
        tilemap_tileset.save!
        { firstgid: tileset["firstgid"].to_i, tilemap_tileset: tilemap_tileset }
      end
      tiles = map.xpath("layer").each.map do |layer|
        tile_ids = layer.text.split(',').map { |tile_id| tile_id.strip.to_i }
        name, width, height = layer["name"], layer["width"].to_i, layer["height"].to_i
        layer = TilemapLayer.new(tilemap: @tilemap, name: name, width: width, height: height)
        layer.save!
        tile_ids.each_with_index.map do |tileset_index, tilemap_index|
          next if tileset_index == 0
          gidindex = tilesets.find_index { |tileset| tileset_index < tileset[:firstgid] }
          gidindex = gidindex.nil? ? tilesets.count - 1 : gidindex - 1
          tileset = tilesets[gidindex]
          {
            tilemap_id: @tilemap.id,
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
    end
    redirect_back fallback_location: "/", allow_other_host: false
  end

  def edit
    @tilemap = Tilemap.find(params[:id])
    @tilesets = Tileset.all
  end

  def update
    @tilemap = Tilemap.find(params[:id])
    @tilemap.update(
      name: params[:tilemap][:name],
      description: params[:tilemap][:description],
      tag_list: params[:tilemap][:tag_list],
    )
    redirect_back fallback_location: "/", allow_other_host: false
  end

  def show
    @no_footer = true
    @tilemap = Tilemap.find(params[:id])
    respond_to do |format| 
      format.xml { render xml: @tilemap.as_xml }
      format.html
      format.json { render json: @tilemap.as_json }
      format.png { send_data @tilemap.as_image.to_blob, :type => 'image/png', :disposition => 'inline' }
    end 
  end

  def destroy
    @tilemap = Tilemap.find(params[:id])
    @tilemap.destroy!
    redirect_back fallback_location: "/", allow_other_host: false
  end
end
