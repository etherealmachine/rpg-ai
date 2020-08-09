import WaveFunction from './WaveFunction'
import { Tilemap } from './Tiled'

test('WaveFunction', () => {
  const groundLayer = new Array(100);
  const wallLayer = new Array(100);
  for (let i = 0; i < 100; i++) {
    groundLayer[i] = Math.floor(Math.random() * 10);
    wallLayer[i] = Math.floor(Math.random() * 10) + 10;
  }
  const layers = [
    {
      id: 1,
      name: "Ground",
      type: 'tilelayer',
      data: groundLayer,
      width: 10,
      height: 10,
      opacity: 1,
      visible: true,
      x: 0,
      y: 0,
    },
    {
      id: 1,
      name: "Wall",
      type: 'tilelayer',
      data: wallLayer,
      width: 10,
      height: 10,
      opacity: 1,
      visible: true,
      x: 0,
      y: 0,
    },
  ];
  const tilesets = [
    {
      firstgid: 1,
      source: "ground.json",
    },
    {
      firstgid: 10,
      source: "walls.json",
    },
  ];
  const tilemap: Tilemap = {
    type: 'map',
    compressionlevel: -1,
    width: 10,
    height: 10,
    layers: layers,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tilewidth: 16,
    tileheight: 16,
    tilesets: tilesets,
    tiledversion: '1.3.4',
    version: 1.2,
  };
  const wf = new WaveFunction(tilemap);
  while (wf.step()) { }
})