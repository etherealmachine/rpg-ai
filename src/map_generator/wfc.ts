import OverlappingModel from './overlapping-model';
import { Tilemap } from '../Tiled';
import Model from './model';

export function generateTilemap(tilemap: Tilemap) {
  const W = tilemap.width;
  const H = tilemap.height;
  const layers = tilemap.layers.filter(layer => layer.type === 'tilelayer').map(layer => layer.data) as number[][];
  const tileset = new Set<string>();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (layers.filter(layer => layer[y * W + x] > 0).length > 0) {
        const hash = layers.map(layer => layer[y * W + x]).join(',');
        tileset.add(hash);
      }
    }
  }
  const tiles = Array.from(tileset);
  const data: number[] = [];
  for (let y = 0; y < tilemap.width; y++) {
    for (let x = 0; x < tilemap.height; x++) {
      if (layers.filter(layer => layer[y * W + x] > 0).length > 0) {
        const hash = layers.map(layer => layer[y * W + x]).join(',');
        data.push(tiles.indexOf(hash) + 1);
      } else {
        data.push(0);
      }
      data.push(0);
      data.push(0);
      data.push(0);
    }
  }
  const img = Uint8ClampedArray.from(data);
  const model = new OverlappingModel(img, tilemap.width, tilemap.height, 2, tilemap.width, tilemap.height, false, false, 1);
  (model as unknown as Model).generate();
  if ((model as unknown as Model).isGenerationComplete()) {
    console.log('success');
    const generated = model.graphics();
    for (let y = 0; y < tilemap.height; y++) {
      for (let x = 0; x < tilemap.width; x++) {
        const tileIndex = generated[y * tilemap.width * 4 + x * 4] - 1;
        tiles[tileIndex].split(',').map(x => parseInt(x)).forEach((t, i) => {
          const data = tilemap.layers[i].data;
          if (data) {
            data[y * tilemap.width + x] = t;
          }
        });
      }
    }
  }
}