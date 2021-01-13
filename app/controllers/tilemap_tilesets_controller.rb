class TilemapTilesetsController < ApplicationController
  before_action :authenticate_user!

  def update
    @tileset = TilemapTileset.find(params[:id])
    if params[:tilemap_tileset][:files]
      @tileset.update(tileset: Tileset.new(current_user).from_files!(params[:tilemap_tileset][:files])) 
    else
      @tileset.update(tileset_id: params[:tilemap_tileset][:tileset_id])
    end
    redirect_back fallback_location: "/", allow_other_host: false
  end
end
