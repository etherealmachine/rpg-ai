class MonstersController < ApplicationController
  def index
    @monsters = Monster.limit(10)
  end

  def show
    @monster = Monster.find(params[:id])
  end
end