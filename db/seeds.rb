# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

user = User.create!(email: "etherealmachine@gmail.com", password: "123456")

def load_item(item)
  match = /(\d+)(cp|sp|gp|ep|pp)/.match item["value"]
  value = nil
  if match.present?
    value, units = match[1].to_i, match[2]
    case units
    when 'cp'
      value /= 100
    when 'sp'
      value /= 10
    when 'ep'
      value *= 2
    when 'pp'
      value *= 10
    end
  end
  text = item["text"].kind_of?(Array) ? item["text"].filter { |t| t.present? } : [item["text"]]
  attunement = text.any? { |t| t.present? && t.include?("Requires Attunement") }
  stealth = nil
  if item["stealth"].present?
    stealth = item["stealth"] == "YES" if item["stealth"].kind_of?(String)
    stealth = item["stealth"] == 1 if item["stealth"].kind_of?(Numeric)
  end
  rarity = text.lazy.map { |t| /Rarity: (\w+)/.match t }&.first&.[](1)
  i = Item.find_or_create_by!(name: item["name"])
  i.range = item["range"]
  i.damage = item["dmg1"]
  i.damage_2 = item["dmg2"]
  i.magical = item["magic"] == 1 || attunement
  i.attunement = attunement
  i.stealth = stealth
  i.strength = item["strength"]
  i.rarity = rarity
  i.value = value
  i.weight = item["weight"]
  i.armor_class = item["ac"]
  i.damage_type = item["dmgType"]
  i.properties = item["property"]&.split(",")&.map(&:strip)
  i.rarity = item["rarity"]
  i.description = text
  i.save!
  
  # Unused
  item["type"]
  item["roll"]
  item["modifier"]
end

def load_feat(item)
  text = item["text"].kind_of?(Array) ? item["text"].filter { |t| t.present? } : [item["text"]]
  feat = Feat.find_or_create_by!(name: item["name"])
  feat.prerequisite = item["prerequisite"]
  feat.description = text
  feat.save!

  # Unused
  item["modifier"]
end

def load_background(item)
  background = Background.find_or_create_by!(name: item["name"])
  background.description = item["trait"].kind_of?(Array) ? item["trait"] : [item["trait"]]
  background.proficiencies = item["proficiency"].split(', ').map do |skill|
    if skill == "Sleight of Hand"
      skill = "Slight of Hand"
    end
    skill
  end if item["proficiency"]
  background.save!
end

def load_race(item)
  race = Race.find_or_create_by!(name: item["name"])
  race.size = item["size"]
  race.speed = item["speed"]
  race.traits = item["trait"]
  race.abilities = item["ability"]
  race.proficiencies = item["proficiency"]&.split(',')&.map(&:strip)
  race.save!
end

def load_spell(item)
  text = item["text"].kind_of?(Array) ? item["text"].filter { |t| t.present? } : [item["text"]]
  spell = Spell.find_or_create_by!(name: item["name"].titleize)
  spell.level = item["level"]
  spell.casting_time = item["time"]
  spell.duration = item["duration"]
  spell.range = item["range"]
  spell.school = item["school"]
  spell.components = item["components"]
  spell.classes = item["classes"]
  spell.ritual = item["ritual"] ? item["ritual"] == "YES" : nil
  spell.description = text
  spell.save!

  # Unused
  item["roll"]
end

def load_monster(item)
  saves = item['save']&.split(',')&.map(&:strip)&.map do |s|
    match = /(\w{3}) (\+?-?\d+)/.match(s)
    [match[1].downcase, match[2].to_i]
  end
  skills = (item['skill'].kind_of?(Array) ? item['skill'] : item['skill']&.split(','))&.map(&:strip)&.map do |s|
    match = /(\w+) (\+?-?\d+)/.match(s)
    [match[1].downcase, match[2].to_i]
  end
  immunities = item["immune"]&.split(',')&.map(&:strip)
  conditionImmunities = item["conditionImmune"]&.split(',')&.map(&:strip)
  m = Monster.find_or_create_by!(name: item["name"])
  m.size = item["size"]
  m.speed = item["speed"]
  m.challenge_rating = item["cr"]
  m.armor_class = item["ac"]
  m.alignment = item["alignment"]
  m.hit_points = item["hp"]
  m.passive_perception = item["passive"]
  m.languages = item["languages"]&.split(',')&.map(&:strip)
  m.types = item["type"]&.split(',')&.map(&:strip)
  m.abilities = {
    str: item["str"],
    dex: item["dex"],
    con: item["con"],
    int: item["int"],
    wis: item["wis"],
    cha: item["cha"],
  }
  m.skills = skills.nil? ? nil : Hash[skills]
  m.resistances = item["resist"]&.split(',')&.map(&:strip)
  m.vulnerabilities = item["vulnerable"]&.split(',')&.map(&:strip)
  m.immunities = immunities ? immunities.concat(conditionImmunities || []) : conditionImmunities
  m.saves = saves.nil? ? nil : Hash[saves]
  m.senses = item["senses"]&.split(',')&.map(&:strip)
  m.traits = item["trait"]
  if m.traits.present? && !m.traits.kind_of?(Array)
    m.traits = [m.traits]
  end
  m.actions = item["action"]
  if m.actions.present? && !m.actions.kind_of?(Array)
    m.actions = [m.actions]
  end
  m.spells = item["spells"]&.split(/[,.]/)&.map(&:strip)&.map do |spell|
    if spell == 'symbol teleport'
      [Spell.find_or_create_by!(name: 'Symbol'), Spell.find_or_create_by!(name: 'Teleport')]
    else
      Spell.find_or_create_by!(name: spell.titleize)
    end
  end.flatten if item["spells"]
  m.spell_slots = item["slots"]&.split(',')&.map(&:strip)&.map(&:to_i)
  m.reactions = item["reaction"]
  if m.reactions.present? && !m.reactions.kind_of?(Array)
    m.reactions = [m.reactions]
  end
  m.legendaries = item["legendary"]
  if m.legendaries.present? && !m.legendaries.kind_of?(Array)
    m.legendaries = [m.legendaries]
  end
  m.save!

  # Unused
  item["description"]
end

def load_character_class(item)
  c = CharacterClass.create!(name: item["name"])
  c.hit_die = item["hd"]
  c.spell_ability = item["spellAbility"]
  c.proficiencies = item["proficiency"]&.split(',')&.map(&:strip)
  c.levels = item["autolevel"]
  c.save!
end

class HashKeyLogger

  attr_reader :base_hash
  attr_reader :keys_touched

  def initialize(base_hash)
    @base_hash = base_hash
    @keys_touched = []
  end

  def [](key)
    @keys_touched << key
    @base_hash[key]
  end

  def untouched_keys
    Set[*@base_hash.keys].subtract(@keys_touched)
  end

end

Dir[Rails.root.join 'db', 'seed_data', '*.json'].each do |f|
  data = JSON.parse(File.read(f))
  data.each do |key, things|
    things = things.filter { |item| item.kind_of? Hash }.map { |item| HashKeyLogger.new(item) }
    case key
    when 'item'
      things.each { |item| load_item(item) }
    when 'feat'
      things.each { |item| load_feat(item) }
    when 'background'
      things.each { |item| load_background(item) }
    when 'race'
      things.each { |item| load_race(item) }
    when 'spell'
      things.each { |item| load_spell(item) }
    when 'monster'
      things.each { |item| load_monster(item) }
    when 'class'
      things.each { |item| load_character_class(item) }
    else raise "Can't handle #{key} from #{f}"
    end
    err = things.find { |item| item.untouched_keys.any? }
    raise "Unused keys in #{key}: #{err.untouched_keys}" if err
  end
end