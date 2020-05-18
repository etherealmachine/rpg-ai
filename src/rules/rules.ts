export interface Rule {

}

const sets = [
  'language', ['none', 'broken', 'conversational', 'fluent'],
  'innate_ability', ['low', 'some', 'average', 'high', 'exceptional'],
  'training', ['none', 'a few lessons', 'some', 'well-trained', 'excellent'],
  'experience', ['none', 'once', 'familiar', 'lots of', 'high'],
  'chance of understanding', ['low', 'medium', 'high'],
  'chance of mis-understanding', ['low', 'medium', 'high'],
]

const innate_abilities = [
  'intelligence',
  'strength',
  'athletics',
  'patience',
  'determination',
  'stubborness',
  'empathy',
  'eyesight',
  'hearing',
  'touch',
  'smell',
  'taste',
]

const skills = [
  'climbing', ['strength', 'athletics', 'intelligence'],
  'melee combat', ['strength', 'athletics', 'determination'],
  'ranged combat', ['athletics', 'eyesight', 'patience'],
  'wrestling', ['strength', 'athletics', 'empathy'],
  'running', ['athletics'],
  'writing (creative)', ['intelligence', 'empathy', 'eyesight'],
  'writing', ['intelligence', 'eyesight'],
  'music', ['intelligence', 'empathy', 'hearing'],
]

const rules = [
  'if language is fluent then chance of understanding is high',
  'if language is broken then chance of mis-understanding is medium',
]