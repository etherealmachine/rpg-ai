export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function bonusify(b: number): string {
  return b >= 0 ? `+${b}` : `-${b}`;
}

export const sizeString = {
  T: 'Tiny',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  H: 'Huge',
  G: 'Gargantuan',
}

export const schoolString = {
  EN: 'Enchantment',
  C: 'Conjuration',
  N: 'Necromancy',
  EV: 'Evocation',
  A: 'Abjuration',
  T: 'Transmutation',
  D: 'Divination',
  I: 'Illusion',
}

export const damageTypeString = {
  S: 'Slashing',
  B: 'Bludgeoning',
  P: 'Piercing',
}

export const itemPropertiesString = {
  V: 'Versatile',
  L: 'Light',
  F: 'Finesse',
  T: 'Thrown',
  H: 'Heavy',
  R: 'Range',
  '2H': 'Two-Handed',
  S: 'Special',
  A: 'Ammunition',
  LD: 'Loading',
}

export interface Feature {
  name: string
  text: string | string[]
  attack?: string
}

export interface Monster {
  id: number
  name?: string
  description?: string[]
  challenge_rating?: number
  armor_class?: number
  armor_description?: string
  hit_points?: string
  passive_perception?: number
  size?: string
  speed?: number
  alignment?: string
  types?: string[]
  languages: string[]
  abilities?: { [key: string]: number }
  skills?: { [key: string]: number }
  senses?: string[]
  saves?: { [key: string]: number }
  resistances?: string[]
  vulnerabilities?: string[]
  immunities?: string[]
  traits?: Feature[]
  actions?: Feature[]
  reactions?: Feature[]
  legendaries?: Feature[]
  spell_slots?: number[]
  created_at: string
  updated_at: string
}

export interface Spell {
  id: number
  name?: string
  level?: number
  casting_time?: string
  duration?: string
  range?: string
  components?: string
  classes?: string[]
  school?: string
  ritual?: boolean
  description?: string[]
  created_at: string
  updated_at: string
}

export interface Item {
  id: number
  name?: string
  magical?: boolean
  attunement?: boolean
  stealth?: boolean
  rarity?: string
  range?: number
  range_2?: number
  strength?: number
  damage?: string
  damage_2?: string
  value?: number
  weight?: number
  armor_class?: number
  damage_type?: string
  description?: string[]
  properties?: string[]
  created_at: number
  updated_at: number
}