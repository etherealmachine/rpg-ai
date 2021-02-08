class SpellsController < ApplicationController
  def index
    @spells = Spell.all
  end

  def show
    @spell = Spell.find(params[:id])
  end
end