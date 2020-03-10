import API from "../API"

export interface NameTextPair {
  name: string
  text: string
}

export interface Monster {
  name: string
  kind: 'monster'
  cr: string | number
  ac: string | number
  hp: string
  passive: number
  size: string
  speed: string
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  alignment: string
  type: string
  description?: string
  action?: NameTextPair[] | NameTextPair
  reaction?: NameTextPair[] | NameTextPair
  legendary?: NameTextPair[] | NameTextPair
  save?: string
  trait?: NameTextPair[] | NameTextPair
  languages?: string
  skill?: string
  resist?: string
  vulnerable?: string
  immune?: string
  conditionImmune?: string
  senses?: string
  spells?: string
  slots?: string
  compendium: { [key: string]: any }
  status?: Status
}

export interface SpellSlots {
  spells: string[]
  slots: number
}

export interface Status {
  hp: number
  maxHP: number
  initiative: number
  level: number
  damage: NameTextPair[]
  saves: NameTextPair[]
  actions: NameTextPair[]
  reactions: NameTextPair[]
  legendaries: NameTextPair[]
  conditions: string[]
  spellSlots: SpellSlots[]
}

export interface Spell {
  name: string
  kind: 'spell'
  level: number
  classes: string
  time: string
  duration: string
  range: string
  components: string
  school: string
  text: string[] | string
}

export interface Item {
  name: string
  kind: 'item'
  range: string
  dmg1: string
  dmg2: string
  dmgType: string
  value: string
  ac: string
  text: string[] | string
}

export interface Feature {
  name: string
  kind: 'feature'
  text: string[] | string
}

export interface Autolevel {
  slots?: string
  feature?: Feature[] | Feature
}

export interface Class {
  name: string
  kind: 'class'
  hd: string
  proficiency: string
  spellAbility: string
  autolevel: Autolevel[]
}

export interface Feat {
  name: string
  kind: 'feat'
}

export interface Race {
  name: string
  kind: 'race'
  trait: NameTextPair[] | NameTextPair
  ability: string
  size: string
  speed: string
}

export interface Background {
  name: string
  kind: 'background'
  trait: NameTextPair[]
  proficiency: string
}

export type CompendiumItem = Background | Class | Feat | Item | Monster | Race | Spell;

export class Compendium {

  public sources: string[] | undefined;
  public backgrounds: { [key: string]: Background } = {}
  public classes: { [key: string]: Class } = {}
  public feats: { [key: string]: Feat } = {}
  public items: { [key: string]: Item } = {}
  public monsters: { [key: string]: Monster } = {}
  public races: { [key: string]: Race } = {}
  public spells: { [key: string]: Spell } = {}
  public loaded: boolean = false;

  public static abilities: string[] = [
    "Strength",
    "Dexterity",
    "Constitution",
    "Intelligence",
    "Wisdom",
    "Charisma"
  ];

  public static skills: { [key: string]: string } = {
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
    "Survival": "Wisdom"
  };

  public static coinage: string[] = [
    "Copper",
    "Silver",
    "Electrum",
    "Gold",
    "Platinum"
  ];

  public static hit_dice_for_class: { [key: string]: number } = {
    "Barbarian": 12,
    "Bard": 8,
    "Cleric": 8,
    "Druid": 8,
    "Fighter": 10,
    "Monk": 8,
    "Paladin": 10,
    "Ranger": 10,
    "Rogue": 8,
    "Sorcerer": 6,
    "Warlock": 8,
    "Wizard": 6
  }

  public static modifier(ability_score: number | string | undefined) {
    if (ability_score === undefined) {
      return NaN;
    }
    if (typeof (ability_score) === 'string') {
      ability_score = parseInt(ability_score);
    }
    return Math.floor((ability_score - 10) / 2);
  }

  public static modifierText(bonus: number) {
    if (isNaN(bonus)) {
      return '';
    }
    if (bonus < 0) {
      return bonus;
    }
    return '+' + bonus;
  }

  public static types: { [key: string]: string } = {
    'background': 'backgrounds',
    'class': 'classes',
    'feat': 'feats',
    'item': 'items',
    'monster': 'monsters',
    'race': 'races',
    'spell': 'spells',
  }

  public static cr_to_xp: { [key: string]: number } = {
    '0': 10,
    '1/8': 25,
    '1/4': 50,
    '1/2': 100,
    '1': 200,
    '2': 450,
    '3': 700,
    '4': 1100,
    '5': 1800,
    '6': 2300,
    '7': 2900,
    '8': 3900,
    '9': 5000,
    '10': 5900,
    '11': 7200,
    '12': 8400,
    '13': 10000,
    '14': 11500,
    '15': 13000,
    '16': 15000,
    '17': 18000,
    '18': 20000,
    '19': 22000,
    '20': 25000,
    '21': 33000,
    '22': 41000,
    '23': 50000,
    '24': 62000,
    '25': 75000,
    '26': 90000,
    '27': 105000,
    '28': 120000,
    '29': 135000,
    '30': 155000,
  }

  public static encounter_difficulty: { [key: number]: number[] } = {
    1: [25, 50, 75, 100],
    2: [50, 100, 150, 200],
    3: [75, 150, 225, 400],
    4: [125, 250, 75, 500],
    5: [250, 500, 750, 1100],
    6: [300, 600, 900, 1400],
    7: [350, 750, 1100, 1700],
    8: [450, 900, 1400, 2100],
    9: [550, 1100, 1600, 2400],
    10: [600, 1200, 1900, 2800],
    11: [800, 1600, 2400, 3600],
    12: [1000, 2000, 3000, 4500],
    13: [1100, 2200, 3400, 5100],
    14: [1250, 2500, 3800, 5700],
    15: [1400, 2800, 4300, 6400],
    16: [1600, 3200, 4800, 7200],
    17: [2000, 3900, 5900, 8800],
    18: [2100, 4200, 6300, 9500],
    19: [2400, 4900, 7300, 10900],
    20: [2800, 5700, 8500, 12700],
  }

  // e.g. AC 19 (natural armor)
  public static ac(m: Monster): number {
    if (typeof m.ac === 'string') {
      const match = m.ac.match(/(\d+)/);
      if (match !== null) {
        return parseInt(match[1]);
      }
      return 10;
    }
    return m.ac;
  }

  public parseSpellSlots(m: Monster): SpellSlots[] {
    if (!m.spells) {
      return [];
    }
    const spellList = m.spells.replace(/^Spells: /, '').split(',').map((spellName) => spellName.trim()) || [];
    const cantrips = spellList.filter((spellName: string) => {
      const spell = Object.values(this.spells).find((spell) => spell.name.toLowerCase() === spellName.toLowerCase());
      return spell?.level === 0;
    });
    return [{
      spells: cantrips,
      slots: NaN,
    }].concat((m.slots?.split(',').map((count, index) => {
      const spellsAtThisLevel = spellList.filter((spellName: string) => {
        const spell = Object.values(this.spells).find((spell) => spell.name.toLowerCase() === spellName.toLowerCase());
        return spell?.level === index + 1;
      });
      return {
        spells: spellsAtThisLevel,
        slots: parseInt(count)
      }
    }) || []));
  }

  async load(name: string) {
    this.sources = (await new API().raw_request(`${process.env.PUBLIC_URL}/compendiums/${name}/index.json`) as Array<string>);
    await Promise.all(this.sources.map(async (source: string) => {
      const sourceData = await new API().raw_request(`${process.env.PUBLIC_URL}/compendiums/${name}/${source}`);
      this.loadData(source, sourceData);
    }));
    (window as any).compendium = this;
    this.loaded = true;
  }

  loadData(source: string, sourceData: any) {
    Object.entries(Compendium.types).forEach(([objType, attrName]) => {
      if (sourceData.hasOwnProperty(objType)) {
        Object.values(sourceData[objType]).forEach((obj: any) => {
          if (obj.name) {
            obj['source'] = source;
            obj['kind'] = objType.slice(0, objType.length);
            (this as any)[attrName][obj.name] = obj;
          }
        });
      }
    });
  }

}

export default Compendium