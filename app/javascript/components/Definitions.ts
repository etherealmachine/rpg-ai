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

export interface Feature {
  name: string
  text: string
  attack?: string
}

export interface Monster {
  id: number
  name: string
  description: string[]
  challenge_rating: number
  armor_class: number
  armor_description: string
  hit_points: string
  passive_perception: number
  size: string
  speed: number
  alignment: string
  types: string[]
  languages: string[]
  abilities: { [key: string]: number }
  skills: { [key: string]: number }
  senses: string[]
  saves: { [key: string]: number }
  resistances: string[]
  vulnerabilities: string[]
  immunities: string[]
  traits: Feature[]
  actions: Feature[]
  reactions: Feature[]
  legendaries: Feature[]
  spell_slots: number[]
  created_at: string
  updated_at: string
}