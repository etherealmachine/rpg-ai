# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

user = User.create!(email: "etherealmachine@gmail.com", password: "123456")

['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].each do |ability|
  Ability.create!(name: ability)
end

['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'].each do |size|
  Size.create!(name: size)
end

{
  "Acrobatics": "Dexterity",
  "Animal Handling": "Wisdom",
  "Arcana": "Intelligence",
  "Athletics": "Strength",
  "Deception": "Charisma",
  "History": "Wisdom",
  "Insight": "Wisdom",
  "Intimidation": "Charisma",
  "Investigation": "Intelligence",
  "Medicine": "Wisdom",
  "Nature": "Intelligence",
  "Perception": "Wisdom",
  "Performance": "Charisma",
  "Persuasion": "Charisma",
  "Religion": "Intelligence",
  "Slight of Hand": "Dexterity",
  "Stealth": "Dexterity",
  "Survival": "Wisdom",
}.each do |name, ability|
  Skill.create!(name: name, ability_id: Ability.find_by(name: ability).id)
end

[
  'Acid',
  'Bludgeoning',
  'Cold',
  'Fire',
  'Force',
  'Lightning',
  'Necrotic',
  'Piercing',
  'Poison',
  'Psychic',
  'Radiant',
  'Slashing',
  'Thunder',
  'Magical',
].each do |damage_type|
  DamageType.create!(name: damage_type)
end

[
  'Common',
  'Dwarvish',
  'Elvish',
  'Giant',
  'Gnomish',
  'Goblin',
  'Halfling',
  'Orc',
  'Abyssal',
  'Celestial',
  'Draconic',
  'Deep Speech',
  'Infernal',
  'Primodial',
  'Sylvan',
  'Undercommon',
].each do |language|
  Language.create!(name: language)
end

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
  if Item.find_by(name: item["name"])
    puts "Skipping already existing item #{item['name']}"
  else
    text = item["text"].kind_of?(Array) ? item["text"].filter { |t| t.present? } : [item["text"]]
    attunement = text.any? { |t| t.present? && t.include?("Requires Attunement") }
    rarity = text.lazy.map { |t| /Rarity: (\w+)/.match t }&.first&.[](1)
    i = Item.create!(
      name: item["name"],
      range: item["range"],
      damage: item["dmg1"],
      magical: item["magic"] == 1 || attunement,
      attunement: attunement,
      rarity: rarity,
      value: value,
      weight: item["weight"],
      armor_class: item["ac"],
      description: text
    )
    i.damage_types << DamageType.find_by(name: "Slashing") if item["dmgType"] == "S"
    i.damage_types << DamageType.find_by(name: "Piercing") if item["dmgType"] == "P"
    i.damage_types << DamageType.find_by(name: "Bludgeoning") if item["dmgType"] == "B"
    i.save!
  end
end

def load_feat(item)
  text = item["text"].kind_of?(Array) ? item["text"].filter { |t| t.present? } : [item["text"]]
  Feat.create!(name: item["name"], description: text)
end

def load_background(item)
  background = Background.create!(name: item["name"], description: item["trait"])
  background.proficiencies = item["proficiency"].split(', ').map do |skill|
    if skill == "Sleight of Hand"
      skill = "Slight of Hand"
    end
    Skill.find_by(name: skill)
  end if item["proficiency"]
  background.save!
end

def load_race(item)
  #raise "#{item}"
end

def load_spell(item)
  #raise "#{item}"
end

def load_monster(item)
  m = Monster.create!(
    name: item["name"],
    size: Size.where("name like ?", item["size"] + '%').first,
    armor_class: item["ac"],
  )
  item["type"].split(", ").each { |t| m.monster_types << MonsterType.find_or_create_by!(name: t) }
  item["alignment"]
  item["hp"]
  item["speed"]
  item["str"]
  item["dex"]
  item["con"]
  item["int"]
  item["wis"]
  item["cha"]
  item["save"]
  item["skill"]
  item["resist"]
  item["vulnerable"]
  item["immune"]
  item["conditionImmune"]
  item["senses"]
  item["passive"]
  item["languages"]
  item["cr"]
  item["trait"]
  item["action"]
  item["attack"]
  item["spells"]
  item["slots"]
end

def load_character_class(item)
  #raise "#{item}"
end

Dir[Rails.root.join 'db', 'seed_data', '*.json'].each do |f|
  data = JSON.parse(File.read(f))
  data.each do |key, things|
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
  end
end