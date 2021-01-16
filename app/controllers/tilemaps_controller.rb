class TilemapsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]

  def index
    @tilemaps = Tilemap.all
  end

  def create
    if params[:files]
      @tilemap = Tilemap.new(user: current_user)
      @tilemap.from_files!(params[:files].values)
      return render json: {}
    else
      file = params.require(:tilemap).require(:file)
      @tilemap = Tilemap.new(user: current_user)
      @tilemap.from_file!(file)
    end
    redirect_back fallback_location: "/", allow_other_host: false
  end

  def edit
    @tilemap = Tilemap.find(params[:id])
    @tilesets = Tileset.all
  end

  def update
    @tilemap = Tilemap.find(params[:id])
    if params[:tilemap][:file]
      @tilemap.from_file!(params[:tilemap][:file])
    end
    @tilemap.update(
      name: params[:tilemap][:name],
      description: params[:tilemap][:description],
      tag_list: params[:tilemap][:tag_list],
    )
    redirect_back fallback_location: "/", allow_other_host: false
  end

  def show
    @fullwidth = true
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
