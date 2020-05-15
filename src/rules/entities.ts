export interface Backstory {
  kind: 'backstory'
}

export interface Limb {
  kind: 'limb'
  name: string
}

export interface Organ {
  kind: 'organ'
  name: string
}

export interface Item {
  kind: 'item'
  name: string
  description: string
}

export interface Skill {
  kind: 'skill'
  name: string
  description: string
}

export interface Stamina {
  kind: 'stamina'
  current: number
  maximum: number
}

export interface Focus {
  kind: 'focus'
  current: number
  maximum: number
}

export interface Faith {
  kind: 'faith'
  god: string
  current: number
  maximum: number
}

export interface Relationship {
  kind: 'relationship'
  from: Character
  to: Character
  type: string
  backstory: Backstory
}

export interface Character {
  kind: 'character'
  name: string
  race: string
  backstory: Backstory
  limbs: Limb[]
  organs: Organ[]
  equipped: Item[]
  items: Item[]
  skills: Skill[]
  stamina: Stamina
  focus: Focus
  faiths: Faith[]
  relationships: Relationship[]
}

export const humanoid = {
  limbs: [
    { limb: 'limb', name: 'left arm' },
    { limb: 'limb', name: 'right arm' },
    { limb: 'limb', name: 'left leg' },
    { limb: 'limb', name: 'right leg' },
  ],
  organs: [
    { organ: 'organ', name: 'brain' },
    { organ: 'organ', name: 'heart' },
    { organ: 'organ', name: 'kidney' },
    { organ: 'organ', name: 'liver' },
    { organ: 'organ', name: 'stomach' },
    { organ: 'organ', name: 'lungs' },
    { organ: 'organ', name: 'spine' },
  ]
}

export const spiked_club = {
  kind: 'item',
  name: 'Spiked Club',
  description: 'A wooden club with iron spikes pounded into it',
}

export function silver(count: number) {
  return {
    kind: 'item',
    name: 'Silver',
    description: `${count} silver pieces`,
  }
}

export function copper(count: number) {
  return {
    kind: 'item',
    name: 'Copper',
    description: `${count} copper pieces`,
  }
}

export function melee(training: string) {
  return {
    kind: 'skill',
    name: 'Melee',
    description: training,
  }
}

export function language(language: string, fluency: string) {
  return {
    kind: 'skill',
    name: language,
    description: `${fluency} ${language}`,
  }
}

export const orc_warrior = {
  equipped: [spiked_club],
  items: [silver(3), copper(8)],
  skills: [
    melee('some training'),
    language('Orcish', 'fluent'),
    language('Common', 'broken'),
  ],
  stamina: { kind: 'stamina', current: 10, maximum: 10 },
  focus: { kind: 'focus', current: 10, maximum: 10 },
  faiths: []
}

export const orc1 = {
  kind: 'character',
  name: "Lak'teal kan Stormkard",
  race: 'Orc',
  backstory: "Lak'teal lives in an abandoned cave at the foothills of the mountains.",
  ...humanoid,
  ...orc_warrior,
}

export const orc2 = {
  kind: 'character',
  name: "Rak'teal kan Stormkard",
  race: 'Orc',
  backstory: "Rak'teal lives in an abandoned cave at the foothills of the mountains with his brother, Lak'teal",
  ...humanoid,
  ...orc_warrior,
}