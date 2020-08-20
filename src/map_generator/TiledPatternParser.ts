import { Tilemap } from '../Tiled';

export default class TiledPatternParser {

  tilemap: Tilemap
  tiles: string[] = []
  map: (number | undefined)[] = []
  patternSize: number
  patterns: (number | undefined)[][] = []

  constructor(tilemap: Tilemap, patternSize: number) {
    this.tilemap = tilemap;
    this.patternSize = patternSize;
    const W = tilemap.width;
    const H = tilemap.height;
    const layers = tilemap.layers.filter(layer => layer.type === 'tilelayer').map(layer => layer.data) as number[][];
    const tileset = new Set<string>();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (layers.filter(layer => layer[y * W + x] > 0).length > 0) {
          const hash = layers.map(layer => layer[y * W + x]).filter(t => t > 0).join(',');
          tileset.add(hash);
        }
      }
    }
    this.tiles = Array.from(tileset);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (layers.filter(layer => layer[y * W + x] > 0).length > 0) {
          const hash = layers.map(layer => layer[y * W + x]).filter(t => t > 0).join(',');
          this.map.push(this.tiles.indexOf(hash));
        } else {
          this.map.push(undefined);
        }
      }
    }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pattern = [];
        for (let dy = 0; dy < patternSize; dy++) {
          for (let dx = 0; dx < patternSize; dx++) {
            pattern.push(this.map[(y + dy) * W + x + dx]);
          }
        }
        this.patterns.push(pattern);
      }
    }
  }

}