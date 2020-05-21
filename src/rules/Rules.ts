import { FuzzyVariable, FuzzyRule, FuzzySystem } from './FuzzyLogic';

export class Rules {

  system: FuzzySystem;

  abilities = [
    'Intelligence',
    'Strength',
    'Patience',
    'Determination',
    'Empathy',
    'Eyesight',
    'Hearing',
    'Touch',
    'Smell',
    'Taste',
    'Reflex',
    'Memory',
  ]

  skills = {
    'Climbing': ['Strength', 'Reflex', 'Intelligence'],
    'Melee Combat': ['Strength', 'Reflex', 'Determination'],
    'Ranged Combat': ['Reflex', 'Eyesight', 'Patience'],
    'Wrestling': ['Strength', 'Reflex', 'Empathy'],
    'Running': ['Reflex'],
    'Writing (Creative)': ['Intelligence', 'Memory', 'Empathy', 'Eyesight'],
    'Writing': ['Intelligence', 'Memory', 'Eyesight'],
    'Music': ['Intelligence', 'Empathy', 'Hearing'],
    'Sailing': ['Reflex', 'Strength', 'Patience', 'Determination'],
    'Lockpicking': ['Touch', 'Patience'],
    'Tracking': ['Eyesight', 'Hearing', 'Patience'],
    'Trapping': ['Patience', 'Intelligence', 'Determination'],
    'Dodge': ['Reflex', 'Empathy', 'Intelligence'],
    'Parry': ['Reflex', 'Empathy', 'Intelligence'],
    'Light Armor': ['Reflex'],
    'Medium Armor': ['Strength', 'Reflex'],
    'Heavy Armor': ['Strength'],
  }

  constructor() {

    const innateAbility = new FuzzyVariable('Innate Ability', 0, 100, 100);
    innateAbility.evenlyDistribute(['None', 'Low', 'Average', 'High', 'Exceptional']);

    const training = new FuzzyVariable('Training', 0, 100, 100);
    training.evenlyDistribute(['None', 'A Few Lessons', 'Some', 'Well-Trained', 'Mastery']);

    const experience = new FuzzyVariable('Experience', 0, 100, 100);
    experience.evenlyDistribute(['None', 'A Little', 'Familiar', 'Copius', 'Frequent']);

    const chanceOfSuccess = new FuzzyVariable('Chance of Success', 0, 100, 100);
    chanceOfSuccess.evenlyDistribute(['None', 'Some', 'Moderate', 'High', 'Guaranteed']);

    const chanceOfMishap = new FuzzyVariable('Chance of Mishap', 0, 100, 100);
    chanceOfMishap.evenlyDistribute(['None', 'Some', 'Moderate', 'High', 'Guaranteed']);

    this.system = new FuzzySystem();
    this.system.addInputVariable(innateAbility);
    this.system.addInputVariable(training);
    this.system.addInputVariable(experience);
    this.system.addOutputVariable(chanceOfSuccess);
    this.system.addOutputVariable(chanceOfMishap);

    this.system.addRule(new FuzzyRule(
      { 'Innate Ability': 'None' },
      { 'Chance of Success': 'None' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Innate Ability': 'Low' },
      { 'Chance of Success': 'Some' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Innate Ability': 'Average' },
      { 'Chance of Success': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Innate Ability': 'High' },
      { 'Chance of Success': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Innate Ability': 'Exceptional' },
      { 'Chance of Success': 'Moderate' },
    ));

    this.system.addRule(new FuzzyRule(
      { 'Training': 'None' },
      { 'Chance of Success': 'Some' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Training': 'A Few Lessons' },
      { 'Chance of Success': 'Some' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Training': 'Some' },
      { 'Chance of Success': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Training': 'Well-Trained' },
      { 'Chance of Success': 'High' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Training': 'Mastery' },
      { 'Chance of Success': 'Guaranteed' },
    ));

    this.system.addRule(new FuzzyRule(
      { 'Experience': 'None' },
      { 'Chance of Success': 'Some' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'A Little' },
      { 'Chance of Success': 'Some' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Familiar' },
      { 'Chance of Success': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Copius' },
      { 'Chance of Success': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Frequent' },
      { 'Chance of Success': 'High' },
    ));

    this.system.addRule(new FuzzyRule(
      { 'Experience': 'None', 'Training': 'None' },
      { 'Chance of Mishap': 'High' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'A Little', 'Training': 'None' },
      { 'Chance of Mishap': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Familiar', 'Training': 'None' },
      { 'Chance of Mishap': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Copius', 'Training': 'None' },
      { 'Chance of Mishap': 'Some' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Frequent', 'Training': 'None' },
      { 'Chance of Mishap': 'Some' },
    ));

    this.system.addRule(new FuzzyRule(
      { 'Experience': 'None', 'Training': 'A Few Lessons' },
      { 'Chance of Mishap': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'A Little', 'Training': 'A Few Lessons' },
      { 'Chance of Mishap': 'Moderate' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Familiar', 'Training': 'A Few Lessons' },
      { 'Chance of Mishap': 'Some' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Copius', 'Training': 'A Few Lessons' },
      { 'Chance of Mishap': 'Some' },
    ));
    this.system.addRule(new FuzzyRule(
      { 'Experience': 'Frequent', 'Training': 'A Few Lessons' },
      { 'Chance of Mishap': 'None' },
    ));
  }
}