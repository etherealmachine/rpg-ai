# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

user = User.create!(email: "etherealmachine@gmail.com", password: "123456")

def load_item(item, source)
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
  i = Item.find_or_create_by!(name: item["name"], source: source)
  i.range, i.range_2 = item["range"].split('/').map(&:strip) if item["range"]
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

def load_feat(item, source)
  text = item["text"].kind_of?(Array) ? item["text"].filter { |t| t.present? } : [item["text"]]
  feat = Feat.find_or_create_by!(name: item["name"], source: source)
  feat.prerequisite = item["prerequisite"]
  feat.description = text
  feat.save!

  # Unused
  item["modifier"]
end

def load_background(item, source)
  background = Background.find_or_create_by!(name: item["name"], source: source)
  background.description = item["trait"].kind_of?(Array) ? item["trait"] : [item["trait"]]
  background.proficiencies = item["proficiency"].split(', ').map do |skill|
    if skill == "Sleight of Hand"
      skill = "Slight of Hand"
    end
    skill
  end if item["proficiency"]
  background.save!
end

def load_race(item, source)
  race = Race.find_or_create_by!(name: item["name"], source: source)
  race.size = item["size"]
  race.speed = item["speed"]
  race.traits = item["trait"]
  race.abilities = item["ability"]
  race.proficiencies = item["proficiency"]&.split(',')&.map(&:strip)
  race.save!
end

def load_spell(item, source)
  text = item["text"].kind_of?(Array) ? item["text"].filter { |t| t.present? } : [item["text"]]
  spell = Spell.find_or_create_by!(name: item["name"].titleize, source: source)
  spell.level = item["level"]
  spell.casting_time = item["time"]
  spell.duration = item["duration"]
  spell.range = item["range"]
  spell.school = item["school"]
  spell.components = item["components"]
  spell.classes = item["classes"].split(',').map(&:strip)
  spell.ritual = item["ritual"] ? item["ritual"] == "YES" : nil
  spell.description = text
  spell.save!

  # Unused
  item["roll"]
end

def load_monster(item, source)
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
  m = Monster.find_or_create_by!(name: item["name"], source: source)
  m.description = item["description"]
  m.size = item["size"]
  m.speed = item["speed"]
  if item["cr"].kind_of?(String)
    num, denom = item["cr"].split('/')
    m.challenge_rating = num.to_f / denom.to_f
  else
    m.challenge_rating = item["cr"]
  end
  m.armor_class = item["ac"]
  m.armor_description = item["ac"]
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
      [Spell.find_or_create_by!(name: 'Symbol', source: source), Spell.find_or_create_by!(name: 'Teleport', source: source)]
    else
      Spell.find_or_create_by!(name: spell.titleize, source: source)
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
end

def load_improved_initiative_monster(item, source)
  m = Monster.find_or_create_by!(name: item["Name"], source: source)
  m.description = item["Description"]
  m.types = item["Type"].split(' ')
  m.size = m.types.shift[0]
  m.armor_class = item["AC"]["Value"]
  m.armor_description = item["AC"]["Notes"]
  m.hit_points = "#{item['HP']['Value']} #{item['HP']['Notes']}"
  m.speed = item["Speed"]
  m.saves = item["Saves"]
  m.senses = item["Senses"]
  m.languages = item["Languages"]
  if item["Challenge"].kind_of?(String)
    num, denom = item["Challenge"].split('/')
    m.challenge_rating = num.to_f / denom.to_f
  else
    m.challenge_rating = item["Challenge"]
  end
  m.abilities = {
    str: item["Abilities"]["Str"],
    dex: item["Abilities"]["Dex"],
    con: item["Abilities"]["Con"],
    int: item["Abilities"]["Int"],
    wis: item["Abilities"]["Wis"],
    cha: item["Abilities"]["Cha"],
  }
  m.vulnerabilities = item['DamageVulnerabilities']
  m.resistances = item['DamageResistances']
  m.immunities = (item['DamageImmunities'] || []).concat(item['ConditionImmunities'] || [])
  m.immunities = nil if m.immunities.empty?
  m.skills = item['Skills'] if item['Skills'].present?
  m.traits = item['Traits'].map { |t| { name: t["Name"], text: t["Content"] } } if item['Traits'].any?
  m.actions = item['Actions'].map { |t| { name: t["Name"], text: t["Content"] } } if item['Actions'].any?
  m.reactions = item['Reactions'].map { |t| { name: t["Name"], text: t["Content"] } } if item['Reactions'].any?
  m.legendaries = item['LegendaryActions'].map { |t| { name: t["Name"], text: t["Content"] } } if item['LegendaryActions'].any?
  m.save!
  
  item['Id']
  item['Path']
  item['InitiativeModifier']
  item['InitiativeAdvantage']
  item['Player']
  item['Source']
  item['Version']
  item['ImageURL']
end

def load_character_class(item, source)
  c = CharacterClass.create!(name: item["name"], source: source)
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
  source = Source.find_or_create_by!(name: File.basename(f, '.json'), user: user)
  data = JSON.parse(File.read(f))
  data.each do |key, things|
    if key.include? 'ImprovedInitiative.Creatures'
      item = HashKeyLogger.new(JSON.parse(things))
      next if item.base_hash.kind_of? Array
      load_improved_initiative_monster(item, source)
      raise "Unused keys in #{key}: #{item.untouched_keys}" if item.untouched_keys.any?
    else
      things = things.filter { |item| item.kind_of? Hash }.map { |item| HashKeyLogger.new(item) }
      case key
      when 'item'
        things.each { |item| load_item(item, source) }
      when 'feat'
        things.each { |item| load_feat(item, source) }
      when 'background'
        things.each { |item| load_background(item, source) }
      when 'race'
        things.each { |item| load_race(item, source) }
      when 'spell'
        things.each { |item| load_spell(item, source) }
      when 'monster'
        things.each { |item| load_monster(item, source) }
      when 'class'
        things.each { |item| load_character_class(item, source) }
      else raise "Can't handle #{key} from #{f}"
      end
      err = things.find { |item| item.untouched_keys.any? }
      raise "Unused keys in #{key}: #{err.untouched_keys}" if err
    end
  end
end

bart = Character.create!(
  name: "Bartharaxxes the Bronze",
  user: user,
  hit_points: 175,
  gold: 515,
  race: Race.find_by(name: "Half-Orc"),
  background: Background.find_by(name: "Acolyte"),
  proficiencies: ['wisdom', 'charisma', 'insight', 'intimidation', 'religion'],
  alignment: 'Lawful Good',
  abilities: {
    str: 15,
    dex: 8,
    con: 16,
    int: 10,
    wis: 18,
    cha: 16,
  },
  spell_slots: [4, 3, 3, 3, 2])
CharacterEquipment.create!(character: bart, item: Item.find_by!(name: 'Nine Lives Stealer Longsword'), equipped: true, charges: 4)
CharacterEquipment.create!(character: bart, item: Item.find_by!(name: 'Shield +3'), equipped: true)
CharacterEquipment.create!(character: bart, item: Item.find_by!(name: 'Chain Mail'), equipped: true)
CharacterEquipment.create!(character: bart, item: Item.find_by!(name: 'Potion of Gaseous Form'), equipped: true)

[
  Spell.find_by!(name: 'Detect Magic'),
  Spell.find_by!(name: 'Divine Favor'),
  Spell.find_by!(name: 'Shield Of Faith'),
  Spell.find_by!(name: 'Cure Wounds'),
  Spell.find_by!(name: 'Bane'),
  Spell.find_by!(name: "Hunter's Mark"),
  Spell.find_by!(name: 'Magic Weapon'),
  Spell.find_by!(name: 'Zone Of Truth'),
  Spell.find_by!(name: 'Hold Person'),
  Spell.find_by!(name: 'Misty Step'),
  Spell.find_by!(name: 'Dispel Magic'),
  Spell.find_by!(name: 'Remove Curse'),
  Spell.find_by!(name: 'Revivify'),
  Spell.find_by!(name: 'Haste'),
  Spell.find_by!(name: 'Protection From Energy'),
  Spell.find_by!(name: 'Banishment'),
  Spell.find_by!(name: 'Death Ward'),
  Spell.find_by!(name: 'Dimension Door'),
  Spell.find_by!(name: 'Raise Dead'),
  Spell.find_by!(name: 'Hold Monster'),
  Spell.find_by!(name: 'Scrying'),
  Spell.find_by!(name: 'Geas'),
].each do |spell|
  CharacterSpell.create!(character: bart, spell: spell)
end

(1..20).each do |level|
  CharacterLevel.create!(character: bart, character_class: CharacterClass.find_by(name: 'Paladin'), level: level)
end

Character.create!(
  name: "Oguk",
  user: user,
  monster: Monster.find_by!(name: "Orc"),
  hit_points: Monster.find_by!(name: "Orc").hit_points.to_i
)
Character.create!(
  name: "Xybtard",
  user: user,
  monster: Monster.find_by!(name: "Goblin"),
  hit_points: Monster.find_by!(name: "Goblin").hit_points.to_i
)
Character.create!(
  name: "Chisel",
  user: user,
  monster: Monster.find_by!(name: "Goblin"),
  hit_points: Monster.find_by!(name: "Goblin").hit_points.to_i
)

hsi = Source.find_by(name: 'Hot Springs Island')

adventurers = RandomTable.create!(
  source: hsi,
  name: "Adventurers",
  roll: '1d40',
  table: {
    1 => 'Ada',
    2 => 'Alphonse',
    3 => 'Audrey',
    4 => 'Bamvo',
    5 => 'Baxter',
    6 => 'Benedict',
    7 => 'Benjamin',
    8 => 'Bokel',
    9 => 'Bryan',
    10 => 'Charlie',
    11 => 'Claire',
    12 => 'Dale',
    13 => 'Eunice',
    14 => 'Felor & Blix',
    15 => 'Fruss',
    16 => 'Golok',
    17 => 'Gretchen',
    18 => 'Horatio',
    19 => 'Horoch',
    20 => 'Ivan',
    21 => 'Jack',
    22 => 'Jelex',
    23 => 'Jenny',
    24 => 'Joni',
    25 => 'Jus',
    26 => 'Luther',
    27 => 'Marcia',
    28 => 'Neville',
    29 => 'Orrin',
    30 => 'Rocky',
    31 => 'Ruben',
    32 => 'Six',
    33 => 'Skletch',
    34 => 'Sssa',
    35 => 'Tabitha',
    36 => 'Travis',
    37 => 'Trevor',
    38 => 'Ulysses',
    39 => 'Wild Eye',
    40 => 'Zulok',
  }
)

fuegonauts = RandomTable.create!(
  source: hsi,
  name: "Fuegonauts",
  roll: '3d6',
  table: {
    3 => { 'Obsidian Giant': 1, 'Obsidian Bladeguard': 2, 'Salamander Trickster': 5, 'Salamander Warrior': 20 },
    4 => { 'Obsidian Bladeguard': 4, 'Salamander Trickster': 2, 'Salamander Warrior': 8 },
    5 => { 'Obsidian Bladeguard': 1, 'Salamander Trickster': 2, 'Combustarino': 2 },
    6 => { 'Combustarino': 6 },
    7 => { 'Salamander Trickster': 2, 'Salamander Warrior': 8, 'Combustarino': 2 },
    8 => { 'Salamander Trickster': 2, 'Combustarino': 3 },
    9 => { 'Salamander Warrior': 6 },
    10 => { 'Salamander Trickster': 1, 'Salamander Warrior': 4 },
    11 => { 'Salamander Trickster': 1, 'Salamander Warrior': 4 },
    12 => { 'Combustarino': 2 },
    13 => { 'Combustarino': 4 },
    14 => { 'Salamander Trickster': 1, 'Combustarino': 2 },
    15 => { 'Salamander Trickster': 2, 'Combustarino': 3 },
    16 => { 'Obsidian Bladeguard': 1, 'Salamander Trickster': 2, 'Combustarino': 2 },
    17 => { 'Obsidian Bladeguard': 2, 'Salamander Trickster': 5, 'Salamander Warrior': 20 },
    18 => { 'Obsidian Giant': 1, 'Obsidian Bladeguard': 3, 'Salamander Trickster': 6, 'Salamander Warrior': 28 },
  }
)

night_axe = RandomTable.create!(
  source: hsi,
  name: "Night Axe",
  roll: '3d6',
  table: {
    3 => { 'Warrior': 10, 'Edgesworn': 4, 'Bonebinder': 1 },
    4 => { 'Warrior': 4, 'Edgesworn': 9, 'Bonebinder': 3 },
    5 => { 'Warrior': 6, 'Edgesworn': 4, 'Bonebinder': 7 },
    6 => { 'Warrior': 5, 'Edgesworn': 2, 'Bonebinder': 4 },
    7 => { 'Edgesworn': 3, 'Bonebinder': 3 },
    8 => { 'Warrior': 4, 'Bonebinder': 1 },
    9 => { 'Warrior': 2, 'Edgesworn': 2,  },
    10 => { 'Warrior': 2, 'Bonebinder': 1 },
    11 => { 'Warrior': 2, },
    12 => { 'Warrior': 1, 'Edgesworn': 2, },
    13 => { 'Warrior': 1, 'Edgesworn': 4 },
    14 => { 'Warrior': 4, 'Edgesworn': 2, 'Bonebinder': 1 },
    15 => { 'Bonebinder': 2 },
    16 => { 'Warrior': 9, 'Edgesworn': 5, 'Bonebinder': 4 },
    17 => { 'Warrior': 7, 'Edgesworn': 6, 'Bonebinder': 5 },
    18 => { 'Warrior': 7, 'Edgesworn': 2, 'Bonebinder': 5 },
  }
)

lizardmen = RandomTable.create!(
  source: hsi,
  name: "Lizardmen",
  roll: '3d6',
  table: {
    3 => { 'Goa': 2 },
    4 => { 'Kiru Ranger': 4 },
    5 => { 'Goa': 1 },
    6 => { 'Kiru Shaman': 1, 'Kiru Ranger': 1 },
    7 => { 'Kiru Shaman': 1 },
    8 => { 'Arva': 4 },
    9 => { 'Arva': 1 },
    10 => { 'Arva': 2 },
    11 => { 'Arva': 2 },
    12 => { 'Arva': 6 },
    13 => { 'Goa': 1 },
    14 => { 'Goa': 1 },
    15 => { 'Kiru Shaman': 1 },
    16 => { 'Kiru Ranger': 3 },
    17 => { 'Kiru Shaman': 1, 'Kiru Ranger': 2 },
    18 => { 'Kiru Shaman': 2, 'Kiru Ranger': 4 },
  }
)

nereids = RandomTable.create!(
  source: hsi,
  name: "Nereids",
  roll: '3d6',
  table: {
    3 => { 'Nereid': 1 },
    4 => { 'Nereid': 4 },
    5 => { 'Nereid': 3, 'Water Imp': 5, 'Earth Imp': 1, 'Water Elemental': 3 },
    6 => { 'Nereid': 3, 'Water Imp': 4, 'Water Elemental': 2 },
    7 => { 'Nereid': 2, 'Water Imp': 1, 'Water Elemental': 3 },
    8 => { 'Nereid': 2, 'Water Elemental': 2 },
    9 => { 'Nereid': 1, 'Water Imp': 1 },
    10 => { 'Nereid': 2, 'Water Imp': 2 },
    11 => { 'Nereid': 1, 'Water Imp': 1, 'Water Elemental': 1 },
    12 => { 'Nereid': 2, 'Earth Imp': 1 },
    13 => { 'Nereid': 2, 'Water Imp': 1, 'Earth Imp': 1 },
    14 => { 'Nereid': 3, 'Water Imp': 1, 'Water Elemental': 1 },
    15 => { 'Nereid': 3, 'Water Imp': 2, 'Earth Imp': 1 },
    16 => { 'Water Imp': 3, 'Water Elemental': 3 },
    17 => { 'Water Elemental': 5 },
    18 => { 'Nereid': 4, 'Water Imp': 7, 'Earth Imp': 1, 'Water Elemental': 3 },
  }
)

vyderac = RandomTable.create!(
  source: hsi,
  name: "Vyderac",
  roll: '3d6',
  table: {
    3 => { 'Matron': 1 },
    4 => { 'Seeker': 6, 'Swarmer': 12, 'Feeder': 2, 'Matron': 1 },
    5 => { 'Seeker': 2, 'Feeder': 1 },
    6 => { 'Swarmer': 12, 'Feeder': 1 },
    7 => { 'Swarmer': 5, 'Feeder': 1 },
    8 => { 'Seeker': 1, 'Swarmer': 9 },
    9 => { 'Seeker': 2 },
    10 => { 'Seeker': 1 },
    11 => { 'Seeker': 1 },
    12 => { 'Seeker': 1, 'Swarmer': 5 },
    13 => { 'Seeker': 1, 'Swarmer': 11 },
    14 => { 'Seeker': 2, 'Swarmer': 7 },
    15 => { 'Seeker': 2, 'Swarmer': 9 },
    16 => { 'Seeker': 1, 'Swarmer': 12, 'Feeder': 1 },
    17 => { 'Seeker': 6, 'Swarmer': 24, 'Feeder': 3 },
    18 => { 'Seeker': 9, 'Swarmer': 34, 'Feeder': 5, 'Matron': 1 },
  }
)

elemental = RandomTable.create!(
  source: hsi,
  name: "Elemental",
  roll: '3d6',
  columns: ['Light Jungle', 'Heavy Jungle', 'Mountainous Jungle', 'Volcano', 'Volcanic', 'Ruins', 'Village', 'Motivation'],
  table: {
    3 => ['Magma Imp', 'Magma Imp', 'Steam Imp', 'Water Imp', 'Water Imp', 'Magma Imp', 'Fire Imp', 'Art'],
    4 => ['Ooze Imp', 'Ooze Imp', 'Earth Imp', 'Ooze Imp', 'Ooze Imp', 'Ooze Imp', 'Steam Imp', 'Meditating'],
    5 => ['Steam Imp', 'Steam Imp', 'Steam Imp', 'Ooze Imp', 'Ooze Imp', 'Ooze Imp', 'Ooze Imp', 'Ritual'],
    6 => ['Water Imp', 'Water Imp', 'Magma Imp', 'Steam Imp', 'Steam Imp', 'Steam Imp', 'Ooze Imp', 'Wounded'],
    7 => ['Water Imp', 'Water Imp', 'Water Imp', 'Earth Imp', 'Earth Imp', 'Fire Imp', 'Earth Imp', 'Diplomacy'],
    8 => ['Earth Imp', 'Earth Imp', 'Fire Imp', 'Fire Imp', 'Fire Imp', 'Earth Imp', 'Earth Imp', 'Laboring'],
    9 => ['Earth Imp', 'Fire Imp', 'Ooze Imp', 'Magma Imp', 'Magma Imp', 'Earth Imp', 'Water Imp', 'Lost/Searching'],
    10 => ['Fire Imp', 'Fire Imp', 'Earth Imp', 'Magma Imp', 'Magma Imp', 'Water Imp', 'Water Imp', 'Fleeing/Pursuit*'],
    11 => ['Fire Elemental', 'Fire Elemental', 'Earth Elemental', 'Magma Elemental', 'Magma Elemental', 'Water Elemental', 'Water Elemental', 'In Combat'],
    12 => ['Earth Elemental', 'Fire Elemental', 'Ooze Elemental', 'Magma Elemental', 'Magma Elemental', 'Earth Elemental', 'Water Elemental', 'Walking'],
    13 => ['Earth Elemental', 'Earth Elemental', 'Fire Elemental', 'Fire Elemental', 'Fire Elemental', 'Earth Elemental', 'Earth Elemental', 'Patrolling'],
    14 => ['Water Elemental', 'Water Elemental', 'Water Elemental', 'Earth Elemental', 'Earth Elemental', 'Fire Elemental', 'Earth Elemental', 'Altered State'],
    15 => ['Water Elemental', 'Water Elemental', 'Magma Elemental', 'Steam Elemental', 'Steam Elemental', 'Steam Elemental', 'Ooze Elemental', 'Hunting/Gathering'],
    16 => ['Steam Elemental', 'Steam Elemental', 'Steam Elemental', 'Ooze Elemental', 'Ooze Elemental', 'Ooze Elemental', 'Ooze Elemental', 'Mating'],
    17 => ['Ooze Elemental', 'Ooze Elemental', 'Earth Elemental', 'Ooze Elemental', 'Ooze Elemental', 'Ooze Elemental', 'Steam Elemental', 'Resting/Camp'],
    18 => ['Magma Elemental', 'Magma Elemental', 'Steam Elemental', 'Water Elemental', 'Water Elemental', 'Magma Elemental', 'Fire Elemental', 'Sleeping'],
  }
)

intelligent = RandomTable.create!(
  source: hsi,
  name: "Intelligent",
  roll: '3d6',
  columns: ['Light Jungle', 'Heavy Jungle', 'Mountainous Jungle', 'Volcano', 'Volcanic', 'Ruins', 'Village', 'Motivation'],
  table: {
    3 => [night_axe, lizardmen, lizardmen, lizardmen, lizardmen, night_axe, lizardmen, 'Art'],
    4 => [nereids, lizardmen, nereids, nereids, adventurers, nereids, adventurers, 'Meditating'],
    5 => [lizardmen, nereids, night_axe, night_axe, adventurers, fuegonauts, adventurers, 'Ritual'],
    6 => [lizardmen, adventurers, night_axe, night_axe, nereids, fuegonauts, fuegonauts, 'Wounded'],
    7 => [adventurers, adventurers, adventurers, adventurers, night_axe, lizardmen, fuegonauts, 'Diplomacy'],
    8 => [adventurers, night_axe, adventurers, adventurers, night_axe, lizardmen, nereids, 'Laboring'],
    9 => [fuegonauts, night_axe, fuegonauts, fuegonauts, night_axe, adventurers, night_axe, 'Lost/Searching'],
    10 => [fuegonauts, night_axe, fuegonauts, fuegonauts, night_axe, adventurers, night_axe, 'Fleeing/Pursuit'],
    11 => [fuegonauts, fuegonauts, fuegonauts, fuegonauts, fuegonauts, adventurers, night_axe, 'In Combat'],
    12 => [fuegonauts, fuegonauts, fuegonauts, fuegonauts, fuegonauts, adventurers, night_axe, 'Walking'],
    13 => [adventurers, fuegonauts, adventurers, adventurers, fuegonauts, lizardmen, nereids, 'Patrolling'],
    14 => [adventurers, adventurers, adventurers, adventurers, fuegonauts, lizardmen, fuegonauts, 'Altered State'],
    15 => [lizardmen, adventurers, night_axe, night_axe, nereids, fuegonauts, fuegonauts, 'Hunting/Gathering'],
    16 => [lizardmen, nereids, night_axe, night_axe, adventurers, fuegonauts, adventurers, 'Mating'],
    17 => [lizardmen, lizardmen, nereids, nereids, adventurers, nereids, adventurers, 'Resting/Camp'],
    18 => [nereids, lizardmen, lizardmen, lizardmen, lizardmen, lizardmen, lizardmen, 'Sleeping'],
  }
)

beast = RandomTable.create!(
  source: hsi,
  name: "Beast",
  roll: '3d6',
  columns: ['Light Jungle', 'Heavy Jungle', 'Mountainous Jungle', 'Volcano', 'Volcanic', 'Ruins', 'Village', 'Motivation'],
  table: {
    3 => ['Crystal Frog', 'Poison Dart Frog', 'Spine Dragon', 'Spine Dragon', 'Spine Dragon', 'Crystal Frog', 'Crystal Frog', 'Sleeping'],
    4 => ['Flayfiend', 'Obsidian Digger', 'Bone Wydarr', 'Obsidian Digger', 'Obsidian Digger', 'Flayfiend', 'Poison Dart Frog', 'Dying'],
    5 => ['Duecadre', 'Blindfire Carpet', 'Coppermane', 'Obsidian Digger', 'Obsidian Digger', 'Duecadre', 'Obsidian Digger', 'Mating'],
    6 => ['Muttering Serpent', 'Dire Boar', 'Giant Bat', 'Bone Wydarr', 'Astral Spinner', 'Muttering Serpent', 'Dire Boar', 'Eating/Being Eaten'],
    7 => ['Broadback', 'Boltforager', 'Boltforager', 'Asstral SSpinner', 'Bone Wydarr', 'Giant Rat', 'Boltforager', 'Patrolling'],
    8 => ['Singing Golem', vyderac, 'Coppermant', 'Bone Wydarr', 'Bone Wydarr', 'Singing Golem', 'Giant Centipede', 'Walking'],
    9 => ['Tabibari', 'Giant Bat', 'Giant Centipede', 'Boltforager', 'Boltforager', 'Shadow', 'Giant Bat', 'Territorial Display'],
    10 => ['Giant Centipede', 'Boar', 'Copperback', 'Giant Rat', 'Giant Rat', 'Giant Centipede', 'Boar', 'In Combat'],
    11 => ['Boar', 'Giant Centipede', 'Boar', 'Giant Centipede', 'Giant Centipede', 'Zip Bird', 'Giant Rat', 'Wounded'],
    12 => ['Giant Rat', 'Giant Rat', 'Giant Rat', 'Boltforager', 'Boltforager', 'Orange Sludge', 'Giant Rat', 'Walking'],
    13 => ['Zip Bird', 'Copperback', 'Zip Bird', 'Bone Wydarr', 'Bone Wydarr', 'Astral Spinner', 'Broadback', 'Territorial Display'],
    14 => [vyderac, 'Blindfire Vine', 'Blindfire Vine', 'Bone Wydarr', 'Bone Wydarr', vyderac, 'Boltforager', 'Rest/Relax/Nest'],
    15 => ['Blindfire Vine', vyderac, vyderac, 'Astral Spinner', 'Astral Spinner', 'Blindfire Vine', 'Copperback', 'Fleeing/Pursuit'],
    16 => ['Dire Boar', 'Giant Centipede', 'Blindfire Carpet', 'Obsidian Digger', 'Obsidian Digger', 'Dire Boar', 'Giant Centipede', 'Hunting/Gathering'],
    17 => ['Spine Dragon', 'Bone Wydarr', 'Obsidian Digger', 'Obsidian Digger', 'Obsidian Digger', 'Spine Dragon', 'Spine Dragon', 'Altered State'],
    18 => ['Poison Dart Frog', 'Spine Dragon', 'Poison Dart Frog', 'Spine Dragon', 'Spine Dragon', 'Poison Dart Frog', 'Astral Spinner', 'Defecating'],
  }
)

appearing = RandomTable.create!(
  source: hsi,
  name: "Number Appearing",
  roll: '3d8',
  table: {
    3 => 1,
    4 => 1,
    5 => 1,
    6 => 2,
    7 => 2,
    8 => 2,
    9 => 2,
    10 => '1d4',
    11 => '1d4',
    12 => '1d4+1',
    13 => '1d4+1',
    14 => '1d6',
    15 => '1d6+1',
    16 => '1d8+2',
    17 => '2d6',
    18 => '3d6',
  }
)

location = RandomTable.create!(
  source: hsi,
  name: "Location",
  roll: '3d6',
  columns: ['Light Jungle', 'Heavy Jungle', 'Mountainous Jungle', 'Volcano', 'Volcanic', 'Ruins', 'Village'],
  table: {
    3 => [intelligent, elemental, intelligent, beast, beast, intelligent, intelligent],
    4 => [intelligent, elemental, intelligent, beast, beast, intelligent, elemental],
    5 => [intelligent, intelligent, intelligent, beast, intelligent, intelligent, beast],
    6 => [elemental, intelligent, intelligent, intelligent, intelligent, elemental, beast],
    7 => [elemental, intelligent, elemental, elemental, elemental, elemental, night_axe],
    8 => [beast, beast, elemental, elemental, elemental, elemental, intelligent],
    9 => [beast, beast, beast, fuegonauts, fuegonauts, beast, night_axe],
    10 => [beast, beast, beast, fuegonauts, fuegonauts, beast, night_axe],
    11 => [beast, beast, beast, fuegonauts, night_axe, beast, night_axe],
    12 => [beast, beast, beast, fuegonauts, night_axe, beast, night_axe],
    13 => [beast, intelligent, elemental, elemental, elemental, beast, intelligent],
    14 => [beast, intelligent, elemental, elemental, elemental, elemental, night_axe],
    15 => [elemental, intelligent, intelligent, intelligent, intelligent, elemental, beast],
    16 => [elemental, elemental, intelligent, intelligent, intelligent, elemental, beast],
    17 => [intelligent, elemental, intelligent, beast, beast, intelligent, elemental],
    18 => [intelligent, elemental, intelligent, beast, beast, intelligent, intelligent],
  }
)