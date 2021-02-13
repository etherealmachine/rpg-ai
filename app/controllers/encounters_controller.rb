class EncountersController < ApplicationController
  def index
    @search_terms = Character.all.map(&:name).concat(Monster.all.map(&:name))
    @characters = Character.all
      .map { |c| c.roll_initiative! if c.initiative.nil?; c }
      .map { |c| c.as_json(include: { race: {}, background: {}, monster: {}, levels: { include: :character_class }, spells: { include: :spell }, items: { include: :item }, feats: {} }) }
  end
end