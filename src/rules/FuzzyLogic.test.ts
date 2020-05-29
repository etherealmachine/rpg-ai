import { FuzzyVariable, FuzzyRule, FuzzySystem } from './FuzzyLogic';

it('computes a crisp output', () => {

  const temp = new FuzzyVariable('Temperature', 10, 40, 100);
  temp.addTriangular('Cold', 10, 10, 25);
  temp.addTriangular('Medium', 15, 25, 35);
  temp.addTriangular('Hot', 25, 40, 40);

  const humidity = new FuzzyVariable('Humidity', 20, 100, 100)
  humidity.addTriangular('Wet', 20, 20, 60)
  humidity.addTrapezoidal('Normal', 30, 50, 70, 90)
  humidity.addTriangular('Dry', 60, 100, 100)

  const motorSpeed = new FuzzyVariable('Speed', 0, 100, 100);
  motorSpeed.addTriangular('Slow', 0, 0, 50);
  motorSpeed.addTriangular('Moderate', 10, 50, 90);
  motorSpeed.addTriangular('Fast', 50, 100, 100);

  const system = new FuzzySystem();
  system.addInputVariable(temp);
  system.addInputVariable(humidity);
  system.addOutputVariable(motorSpeed);

  system.addRule(new FuzzyRule({ 'Temperature': 'Cold', 'Humidity': 'Wet' }, { 'Speed': 'Slow' }));
  system.addRule(new FuzzyRule({ 'Temperature': 'Cold', 'Humidity': 'Normal' }, { 'Speed': 'Slow' }));
  system.addRule(new FuzzyRule({ 'Temperature': 'Medium', 'Humidity': 'Wet' }, { 'Speed': 'Slow' }));
  system.addRule(new FuzzyRule({ 'Temperature': 'Medium', 'Humidity': 'Normal' }, { 'Speed': 'Moderate' }));
  system.addRule(new FuzzyRule({ 'Temperature': 'Cold', 'Humidity': 'Dry' }, { 'Speed': 'Moderate' }));
  system.addRule(new FuzzyRule({ 'Temperature': 'Hot', 'Humidity': 'Wet' }, { 'Speed': 'Moderate' }));
  system.addRule(new FuzzyRule({ 'Temperature': 'Hot', 'Humidity': 'Normal' }, { 'Speed': 'Fast' }));
  system.addRule(new FuzzyRule({ 'Temperature': 'Hot', 'Humidity': 'Dry' }, { 'Speed': 'Fast' }));
  system.addRule(new FuzzyRule({ 'Temperature': 'Medium', 'Humidity': 'Dry' }, { 'Speed': 'Fast' }));

  expect(system.evaluate({
    'Temperature': 18,
    'Humidity': 60
  })['Speed']).toBeCloseTo(37.507);

  expect(system.evaluate({
    'Temperature': 25,
    'Humidity': 70
  })['Speed']).toBeCloseTo(53.405);

});