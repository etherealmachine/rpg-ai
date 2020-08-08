import WaveFunctionCollapse from './WaveFunctionCollapse';

test('wave function collapse in 2 dimensions', () => {
  const weights = [1, 1, 1];
  const rules = [
    [0, 0, 1],
    [0, 1, 0],
    [1, 1, 2],
  ];

  const wfc = new WaveFunctionCollapse(2, rules, weights);

  // define a region of interest inside which you want tiles to be generated
  // by passing two corners of the bounding box/cube/hypercube
  var size = 5;
  wfc.expand([-size, -size], [size, size]);

  console.log(wfc.wave);
  console.log(wfc.wavefront);

  wfc.step();

  // ^ get the current result, an object mapping coordinate to tile index
  // something like {'1,2':0, '2,2':2, '3,1':1, ...}

  // use wfc.readout(false) to read the result as probability distribution,
  // something like {'1,2',[1,0,0], '2,2':[0.3,0.2,0.5], ...}
});