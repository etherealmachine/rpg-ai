class HomeController < ApplicationController
  def index
    @tilemaps = Tilemap.order(created_at: :desc).limit(10)
    @tilesets = Tileset.order(created_at: :desc).limit(10)
  end

  def about
  end

  def copyright
  end
end