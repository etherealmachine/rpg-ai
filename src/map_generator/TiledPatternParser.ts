import { Tilemap } from '../Tiled';
import { Pattern, Direction } from './Generator';

export default class TiledPatternParser {

  tilemap: Tilemap
  tiles: string[] = []
  map: (number | undefined)[] = []
  patternSize: number
  patterns: Pattern[] = []
  weights: number[] = []
  adjacent: Map<number, Map<Direction, Map<number, boolean>>> = new Map()
  neighbors: Map<Direction, { x: number, y: number }> = new Map([
    [Direction.Left, { x: -1, y: 0 }],
    [Direction.Right, { x: 1, y: 0 }],
    [Direction.Up, { x: 0, y: -1 }],
    [Direction.Down, { x: 0, y: 1 }],
  ])

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
          const hash = layers.map(layer => layer[y * W + x]).join(',');
          tileset.add(hash);
        }
      }
    }
    this.tiles = Array.from(tileset);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (layers.filter(layer => layer[y * W + x] > 0).length > 0) {
          const hash = layers.map(layer => layer[y * W + x]).join(',');
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
        if (pattern.indexOf(undefined) === -1) {
          if (this.patterns.indexOf(pattern as Pattern) === -1) {
            this.patterns.push(pattern as Pattern);
            this.weights.push(1);
          } else {
            this.weights[this.patterns.indexOf(pattern as Pattern)]++;
          }
        }
      }
    }

    for (let i = 0; i < this.patterns.length; i++) {
      this.adjacent.set(i, new Map());
      for (let dir of this.neighbors.keys()) {
        this.adjacent.get(i)?.set(dir, new Map());
      }
      for (let j = 0; j < this.patterns.length; j++) {
        for (let [dir, delta] of this.neighbors.entries()) {
          if (this.canOverlap(this.patterns[i], this.patterns[j], delta.x, delta.y)) {
            this.adjacent.get(i)?.get(dir)?.set(j, true);
          }
        }
      }
    }
  }

  canOverlap(pattern1: number[], pattern2: number[], dx: number, dy: number): boolean {
    for (let x = 0; x < this.patternSize; x++) {
      for (let y = 0; y < this.patternSize; y++) {
        if (x + dx < 0 || x + dx >= this.patternSize || y + dy < 0 || y + dy >= this.patternSize) continue;
        const tile1 = pattern1[(y + dy) * this.patternSize + (x + dx)];
        const tile2 = pattern2[y * this.patternSize + x];
        if (tile1 !== tile2) return false;
      }
    }
    return true;
  }

}