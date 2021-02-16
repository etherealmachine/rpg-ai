class EncountersController < ApplicationController
  def index
    @id = 1
    @search_terms = Character.all.map(&:name).concat(Monster.all.map(&:name)).uniq
    @characters = Character.all
      .map { |c| c.roll_initiative! if c.initiative.nil?; c }
      .map { |c| c.as_json(include: { race: {}, background: {}, monster: {}, levels: { include: :character_class }, spells: { include: :spell }, items: { include: :item }, feats: {} }) }
  end

  def update
    case params["encounter"]["action"]
    when "add"
      monster = Monster.find_by!(name: params["name"])
      character = Character.create!(name: monster.name, monster: monster)
      character.roll_initiative!
    when "remove"
      Character.find(params["encounter"]["id"]).destroy!
    end
  end

end