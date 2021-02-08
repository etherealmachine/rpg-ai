class MonstersController < ApplicationController
  def index
    @monsters = Monster.limit(10).includes(:spells)
  end

  def show
  end
end