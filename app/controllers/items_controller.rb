class ItemsController < ApplicationController
  def index
    @items = Item.limit(10)
  end

  def show
    @item = Item.find(params[:id])
  end
end