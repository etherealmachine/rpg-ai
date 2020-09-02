import ClingoService from '../ClingoService';

import { Tilemap } from '../Tiled';

const Program = `
1 { assign(X,Y,P):pattern(P) } 1 :- cell(X,Y).
:- adj(X1,Y1,X2,Y2,DX,DY),
assign(X1,Y1,P1),
not 1 { assign(X2,Y2,P2):legal(DX,DY,P1,P2) }.

#show assign/3.
`;

type Pattern = number[]

enum Direction {
  Left = 'Left',
  Right = 'Right',
  Up = 'Up',
  Down = 'Down',
}

export default class Generator {

  tilemap: Tilemap
  tiles: string[] = []
  map: (number | undefined)[] = []
  patternSize: number
  patterns: Pattern[] = []
  patternIndex: Map<number, number> = new Map()
  weights: number[] = []
  adjacent: Map<number, Map<Direction, Set<number>>> = new Map()
  neighbors: Map<Direction, { x: number, y: number }> = new Map([
    [Direction.Left, { x: -1, y: 0 }],
    [Direction.Right, { x: 1, y: 0 }],
    [Direction.Up, { x: 0, y: -1 }],
    [Direction.Down, { x: 0, y: 1 }],
  ])
  targetWidth: number
  targetHeight: number

  constructor(tilemap: Tilemap, patternSize: number, width: number, height: number) {
    this.tilemap = tilemap;
    this.patternSize = patternSize;
    this.targetWidth = width;
    this.targetHeight = height;
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
          const patternString = pattern.join(',');
          const patternIndex = this.patterns.findIndex(p => p.join(',') === patternString)
          if (patternIndex === -1) {
            this.patterns.push(pattern as Pattern);
            this.patternIndex.set(y * W + x, this.patterns.length - 1);
            this.weights.push(1);
          } else {
            this.patternIndex.set(y * W + x, patternIndex);
            this.weights[patternIndex]++;
          }
        }
      }
    }

    if (this.patternSize === 1) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const currPatternIndex = this.patternIndex.get(y * W + x);
          if (currPatternIndex === undefined) continue;
          for (let [dir, delta] of this.neighbors.entries()) {
            const nx = x + delta.x;
            const ny = y + delta.y;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            const neighborPatternIndex = this.patternIndex.get(ny * W + nx);
            if (neighborPatternIndex === undefined) continue;
            if (!this.adjacent.has(currPatternIndex)) this.adjacent.set(currPatternIndex, new Map());
            if (!this.adjacent.get(currPatternIndex)?.has(dir)) this.adjacent.get(currPatternIndex)?.set(dir, new Set());
            this.adjacent.get(currPatternIndex)?.get(dir)?.add(neighborPatternIndex);
          }
        }
      }
    } else {
      for (let i = 0; i < this.patterns.length; i++) {
        this.adjacent.set(i, new Map());
        for (let dir of this.neighbors.keys()) {
          this.adjacent.get(i)?.set(dir, new Set());
        }
        for (let j = 0; j < this.patterns.length; j++) {
          for (let [dir, delta] of this.neighbors.entries()) {
            if (this.canOverlap(this.patterns[i], this.patterns[j], delta.x, delta.y)) {
              this.adjacent.get(i)?.get(dir)?.add(j);
            }
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

  async generate(): Promise<Tilemap> {
    const patterns = `pattern(0..${this.patterns.length - 1}).`;
    const cells = `cell(0..${this.targetWidth - 1},0..${this.targetHeight - 1}).`;
    const adj: string[] = [];
    for (let x = 0; x < this.targetWidth; x++) {
      for (let y = 0; y < this.targetHeight; y++) {
        for (let delta of this.neighbors.values()) {
          if (x + delta.x >= 0 && x + delta.x < this.targetWidth && y + delta.y >= 0 && y + delta.y < this.targetHeight) {
            adj.push(`adj(${x}, ${y}, ${x + delta.x}, ${y + delta.y}, ${delta.x}, ${delta.y}).`);
          }
        }
      }
    }
    const legal: string[] = [];
    for (let [p1, directions] of this.adjacent.entries()) {
      for (let [direction, patterns] of directions.entries()) {
        const delta = this.neighbors.get(direction);
        if (delta === undefined) throw Error(`No delta found for direction ${direction}`);
        for (let p2 of patterns) {
          legal.push(`legal(${delta.x}, ${delta.y}, ${p1}, ${p2}).`)
        }
      }
    }

    const resp = await ClingoService.RunProgram({
      Program: [
        patterns,
        cells,
        ...adj,
        ...legal,
        Program,
      ].join('\n')
    });

    return new Promise((resolve, reject) => {
      const match = resp.Stdout.match(/Answer:\W+1\W+(.*)\W+SATISFIABLE/);
      if (match !== null && match.length === 2) {
        const atoms = match[1].split(' ');
        const newTilemap = JSON.parse(JSON.stringify(this.tilemap)) as Tilemap;
        newTilemap.width = this.targetWidth;
        newTilemap.height = this.targetHeight;
        const map: number[] = new Array(this.targetWidth * this.targetHeight);
        for (let atom of atoms) {
          const match = atom.match(/assign\((\d+),\W*(\d+),\W*(\d+)\)/);
          if (match === null) throw new Error(`No match found for ${atom}`);
          const [_, x, y, p] = match;
          map[parseInt(y) * this.targetWidth + parseInt(x)] = parseInt(p);
        }
        newTilemap.layers.forEach((layer, layerIndex) => {
          layer.data = new Array(this.targetWidth * this.targetHeight);
          layer.width = this.targetWidth;
          layer.height = this.targetHeight;
          for (let x = 0; x < this.targetWidth; x++) {
            for (let y = 0; y < this.targetHeight; y++) {
              const i = y * this.targetWidth + x;
              layer.data[i] = parseInt(this.tiles[this.patterns[map[i]][0]].split(',')[layerIndex]);
            }
          }
        });
        resolve(newTilemap);
      } else {
        console.log(match);
        reject(resp.Stderr);
      }
    });
  }

}