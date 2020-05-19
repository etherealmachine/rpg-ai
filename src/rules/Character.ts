export interface Character {
  kind: 'character'
  name: string
  race: string
  backstory: string
  limbs: Limb[]
  organs: Organ[]
  equipped: Item[]
  items: Item[]
  abilities: { [key: string]: string }
  skills: { [key: string]: { [key: string]: string } }
  stamina: Stamina
  focus: Focus
  faiths: Faith[]
  connections: Connection[]
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
  training: number
  experience: number
}

export interface Ability {
  kind: 'ability'
  name: string
  ability: number
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

export interface Connection {
  kind: 'connection'
  character: string
  relationship: string
}

export const humanoid = {
  limbs: [
    { kind: 'limb', name: 'left arm' },
    { kind: 'limb', name: 'right arm' },
    { kind: 'limb', name: 'left leg' },
    { kind: 'limb', name: 'right leg' },
  ],
  organs: [
    { kind: 'organ', name: 'brain' },
    { kind: 'organ', name: 'heart' },
    { kind: 'organ', name: 'kidney' },
    { kind: 'organ', name: 'liver' },
    { kind: 'organ', name: 'stomach' },
    { kind: 'organ', name: 'lungs' },
    { kind: 'organ', name: 'spine' },
    { kind: 'organ', name: 'blood' },
  ]
}

export const spiked_club = {
  kind: 'item',
  name: 'Spiked Club',
  description: 'A wooden club with iron spikes pounded into it',
  skills: ['Melee Combat'],
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

export const orc_warrior = {
  equipped: [spiked_club],
  items: [silver(3), copper(8)],
  skills: {
    'Melee Combat': { 'Training': 'Some', 'Experience': 'Once' },
    'Orcish': { 'Training': 'None', 'Experience': 'Frequent' },
    'Common': { 'Training': 'None', 'Experience': 'A Little' },
  },
  abilities: {
    'Intelligence': 'Low',
    'Strength': 'High',
    'Athletics': 'Average',
    'Patience': 'Low',
    'Determination': 'Low',
    'Stubborness': 'Average',
    'Empathy': 'Low',
    'Eyesight': 'Average',
    'Hearing': 'Average',
    'Touch': 'Average',
    'Smell': 'Average',
    'Taste': 'Average',
  },
  stamina: { kind: 'stamina', current: 10, maximum: 10 },
  focus: { kind: 'focus', current: 10, maximum: 10 },
  faiths: [{
    'kind': 'faith',
    god: 'Gork',
    current: 10,
    maximum: 10,
  }]
}

export const orc1 = {
  kind: 'character',
  name: "Lak'teal kan Stormkard",
  race: 'Orc',
  backstory: "Lak'teal lives in an abandoned cave at the foothills of the mountains.",
  ...humanoid,
  ...orc_warrior,
  connections: [{
    kind: 'connection',
    character: "Rak'teal kan Stormkard",
    relationship: 'brother',
  }],
}

export const orc2 = {
  kind: 'character',
  name: "Rak'teal kan Stormkard",
  race: 'Orc',
  backstory: "Rak'teal lives in an abandoned cave at the foothills of the mountains with his brother, Lak'teal",
  ...humanoid,
  ...orc_warrior,
  connections: [{
    kind: 'connection',
    character: "Lak'teal kan Stormkard",
    relationship: 'brother',
  }],
}