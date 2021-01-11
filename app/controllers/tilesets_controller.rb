class TilesetsController < ApplicationController
  before_action :authenticate_user!, except: [:show]

  def create
    files = params.require(:tileset).require(:files)
    @tileset = Tileset.new(user: current_user)
    @tileset.from_files!(files)
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
    @tileset.from_files!(params[:tileset][:files]) if params[:tileset][:files]
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
