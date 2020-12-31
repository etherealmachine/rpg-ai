class TilesetsController < ApplicationController
  before_action :authenticate_user!, except: [:show]

  def create
    files = params.require(:tileset).require(:files)
    @tileset = Tileset.create_from_files!(current_user, files)
    redirect_back fallback_location: "/", allow_other_host: false
  end

  def edit
    @tileset = Tileset.find(params[:id])
  end

  def update
    @tileset = Tileset.find(params[:id])
    @tileset.update(
      name: params[:tileset][:name],
      description: params[:tileset][:description],
      tag_list: params[:tileset][:tag_list],
    )
    redirect_back fallback_location: "/", allow_other_host: false
  end

  def show
    @tileset = Tileset.find(params[:id])
    respond_to do |format| 
      format.json { render json: @tileset.as_json }
      format.html
    end 
  end

  def destroy
    @tileset = Tileset.find(params[:id])
    @tileset.destroy!
    redirect_back fallback_location: "/", allow_other_host: false
  end

  def image
    @tileset = Tileset.find(params[:id])
    @tileset.image
  end

end
