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

    const innateAbility = new FuzzyVariable('Innate Ability', 0, 99, 100);
    innateAbility.evenlyDistribute(['Low', 'Average', 'High']);

    const training = new FuzzyVariable('Training', 0, 99, 100);
    training.evenlyDistribute(['None', 'Some', 'A Lot']);

    const experience = new FuzzyVariable('Experience', 0, 99, 100);
    experience.evenlyDistribute(['None', 'Some', 'A Lot']);

    const chanceOfSuccess = new FuzzyVariable('Chance of Success', 0, 99, 100);
    chanceOfSuccess.evenlyDistribute(['None', 'Low', 'Medium', 'Good', 'High']);

    this.system = new FuzzySystem();
    this.system.addInputVariable(innateAbility);
    this.system.addInputVariable(training);
    this.system.addInputVariable(experience);
    this.system.addOutputVariable(chanceOfSuccess);

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'None', 'Experience': 'None' }, { 'Chance of Success': 'None' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'None', 'Experience': 'Some' }, { 'Chance of Success': 'Low' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'None', 'Experience': 'A Lot' }, { 'Chance of Success': 'Low' }));

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'Some', 'Experience': 'None' }, { 'Chance of Success': 'Low' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'Some', 'Experience': 'Some' }, { 'Chance of Success': 'Low' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'Some', 'Experience': 'A Lot' }, { 'Chance of Success': 'Medium' }));

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'A Lot', 'Experience': 'None' }, { 'Chance of Success': 'Medium' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'A Lot', 'Experience': 'Some' }, { 'Chance of Success': 'Good' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Low', 'Training': 'A Lot', 'Experience': 'A Lot' }, { 'Chance of Success': 'Good' }));

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'None', 'Experience': 'None' }, { 'Chance of Success': 'Low' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'None', 'Experience': 'Some' }, { 'Chance of Success': 'Medium' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'None', 'Experience': 'A Lot' }, { 'Chance of Success': 'Medium' }));

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'Some', 'Experience': 'None' }, { 'Chance of Success': 'Medium' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'Some', 'Experience': 'Some' }, { 'Chance of Success': 'Medium' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'Some', 'Experience': 'A Lot' }, { 'Chance of Success': 'Good' }));

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'A Lot', 'Experience': 'None' }, { 'Chance of Success': 'Medium' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'A Lot', 'Experience': 'Some' }, { 'Chance of Success': 'Good' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'Average', 'Training': 'A Lot', 'Experience': 'A Lot' }, { 'Chance of Success': 'High' }));

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'None', 'Experience': 'None' }, { 'Chance of Success': 'Medium' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'None', 'Experience': 'Some' }, { 'Chance of Success': 'Good' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'None', 'Experience': 'A Lot' }, { 'Chance of Success': 'Good' }));

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'Some', 'Experience': 'None' }, { 'Chance of Success': 'Good' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'Some', 'Experience': 'Some' }, { 'Chance of Success': 'Good' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'Some', 'Experience': 'A Lot' }, { 'Chance of Success': 'High' }));

    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'A Lot', 'Experience': 'None' }, { 'Chance of Success': 'Good' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'A Lot', 'Experience': 'Some' }, { 'Chance of Success': 'High' }));
    this.system.addRule(new FuzzyRule({ 'Innate Ability': 'High', 'Training': 'A Lot', 'Experience': 'A Lot' }, { 'Chance of Success': 'High' }));
  }
}