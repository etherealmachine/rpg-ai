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
  Feat.create!(name: item["name"], prerequisite: item["prerequisite"], description: text)

  # Unused
  item["modifier"]
end

def load_background(item)
  background = Background.create!(name: item["name"], description: item["trait"].kind_of?(Array) ? item["trait"] : [item["trait"]])
  background.proficiencies = item["proficiency"].split(', ').map do |skill|
    if skill == "Sleight of Hand"
      skill = "Slight of Hand"
    end
    skill
  end if item["proficiency"]
  background.save!
end

def load_race(item)
  Race.create!(
    name: item["name"],
    size: item["size"],
    speed: item["speed"],
    traits: item["trait"],
    abilities: item["ability"],
    proficiencies: item["proficiency"]&.split(',')&.map(&:strip)
  )
end

def load_spell(item)
  text = item["text"].kind_of?(Array) ? item["text"].filter { |t| t.present? } : [item["text"]]
  spell = Spell.create!(
    name: item["name"],
    level: item["level"],
    casting_time: item["time"],
    duration: item["duration"],
    range: item["range"],
    school: item["school"],
    components: item["components"],
    classes: item["classes"],
    ritual: item["ritual"] ? item["ritual"] == "YES" : nil,
    description: text
  )

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
  m = Monster.create!(
    name: item["name"],
    size: item["size"],
    speed: item["speed"],
    challenge_rating: item["cr"],
    armor_class: item["ac"],
    alignment: item["alignment"],
    hit_points: item["hp"],
    passive_perception: item["passive"],
    languages: item["languages"]&.split(',')&.map(&:strip),
    types: item["type"]&.split(',')&.map(&:strip),
    abilities: {
      str: item["str"],
      dex: item["dex"],
      con: item["con"],
      int: item["int"],
      wis: item["wis"],
      cha: item["cha"],
    },
    skills: skills.nil? ? nil : Hash[skills],
    resistances: item["resist"]&.split(',')&.map(&:strip),
    vulnerabilities: item["vulnerable"]&.split(',')&.map(&:strip),
    immunities: immunities ? immunities.concat(conditionImmunities || []) : conditionImmunities,
    saves: saves.nil? ? nil : Hash[saves],
    senses: item["senses"]&.split(',')&.map(&:strip),
    traits: item["trait"],
    actions: item["action"],
    attacks: item["attack"],
    spells: item["spells"]&.split(',')&.map(&:strip),
    spell_slots: item["slots"]&.split(',')&.map(&:strip)&.map(&:to_i),
    reactions: item["reaction"],
    legendaries: item["legendary"]
  )

  # Unused
  item["description"]
end

def load_character_class(item)
  CharacterClass.create!(
    name: item["name"],
    hit_die: item["hd"],
    spell_ability: item["spellAbility"],
    proficiencies: item["proficiency"]&.split(',')&.map(&:strip),
    levels: item["autolevel"]
  )
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