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
  tileIndex: number[]
  patternSize: number
  patterns: Pattern[] = []
  patternIndex: number[]
  patternWeights: number[] = []
  adjacent: Map<number, Map<Direction, Set<number>>> = new Map()
  compatible: Map<number, Map<Direction, Set<number>>> = new Map()
  neighbors: Map<Direction, { x: number, y: number }> = new Map([
    [Direction.Left, { x: -1, y: 0 }],
    [Direction.Right, { x: 1, y: 0 }],
    [Direction.Up, { x: 0, y: -1 }],
    [Direction.Down, { x: 0, y: 1 }],
  ])
  constraints: Map<number, number> = new Map()
  targetWidth: number
  targetHeight: number

  constructor(tilemap: Tilemap, patternSize: number, x1: number, y1: number, x2: number, y2: number) {
    this.tilemap = tilemap;
    this.patternSize = patternSize;
    this.targetWidth = x2 - x1;
    this.targetHeight = y2 - y1;
    this.tileIndex = new Array(this.tilemap.width * this.tilemap.height);
    this.patternIndex = new Array(this.tilemap.width * this.tilemap.height);

    const tileset = new Set<string>();
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const tile = this.tileStringAt(x, y);
        if (tile) tileset.add(tile);
      }
    }
    this.tiles = new Array(...tileset);
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const tile = this.tileStringAt(x, y);
        if (tile === undefined) throw new Error(`undefined tile at ${x}, ${y}`);
        const tileIndex = this.tiles.indexOf(tile);
        if (tileIndex === -1) throw new Error(`can't find tile index for ${tile} at ${x}, ${y}`);
        this.tileIndex[y * this.tilemap.width + x] = tileIndex;
      }
    }
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const pattern = [];
        for (let dy = 0; dy < patternSize; dy++) {
          for (let dx = 0; dx < patternSize; dx++) {
            const [nx, ny] = [x + dx, y + dy];
            const tile = this.tileStringAt(nx, ny);
            if (tile === undefined) continue;
            const tileIndex = this.tiles.indexOf(tile);
            pattern.push(tileIndex);
          }
        }
        if (pattern.length !== patternSize * patternSize) continue;
        const patternString = pattern.join(',');
        let patternIndex = this.patterns.findIndex(p => p.join(',') === patternString);
        const mapIndex = this.index(x, y);
        if (patternIndex === -1) {
          this.patterns.push(pattern as Pattern);
          this.patternWeights.push(1);
          patternIndex = this.patterns.length - 1;
        } else {
          this.patternWeights[patternIndex]++;
        }
        this.patternIndex[mapIndex] = patternIndex;
      }
    }
    for (let x = 0; x < this.tilemap.width; x++) {
      for (let y = 0; y < this.tilemap.height; y++) {
        const tileIndex = this.tileIndexAt(x, y);
        for (let [dir, delta] of this.neighbors.entries()) {
          const [nx, ny] = [x + delta.x, y + delta.y];
          const neighborIndex = this.tileIndexAt(nx, ny);
          if (tileIndex !== undefined && neighborIndex !== undefined) {
            this.addAdjacency(tileIndex, dir, neighborIndex);
            this.addAdjacency(neighborIndex, this.inverse(dir), tileIndex);
          }
        }
      }
    }
    for (let i = 0; i < this.patterns.length; i++) {
      for (let j = 0; j < this.patterns.length; j++) {
        for (let [dir, delta] of this.neighbors.entries()) {
          if (this.canOverlap(i, j, delta.x, delta.y)) {
            this.addCompatible(i, dir, j);
            this.addCompatible(j, this.inverse(dir), i);
          }
        }
      }
    }

  }

  index(x: number, y: number): number {
    return x + y * this.tilemap.width;
  }

  indexPattern(x: number, y: number): number {
    return x + y * this.patternSize;
  }

  inverse(d: Direction): Direction {
    switch (d) {
      case Direction.Left: return Direction.Right;
      case Direction.Right: return Direction.Left;
      case Direction.Up: return Direction.Down;
      case Direction.Down: return Direction.Up;
    }
  }

  tileAt(x: number, y: number): number[] | undefined {
    if (x < 0 || x >= this.tilemap.width || y < 0 || y >= this.tilemap.height) return undefined;
    return this.tilemap.layers.map(layer => {
      const data = layer.data;
      if (!data) return 0;
      return data[y * this.tilemap.width + x];
    });
  }

  tileStringAt(x: number, y: number): string | undefined {
    if (x < 0 || x >= this.tilemap.width || y < 0 || y >= this.tilemap.height) return undefined;
    return this.tilemap.layers.map(layer => {
      const data = layer.data;
      if (!data) return 0;
      return data[y * this.tilemap.width + x];
    }).join(',');
  }

  tileIndexAt(x: number, y: number): number | undefined {
    return this.tileIndex[y * this.tilemap.width + x];
  }

  addAdjacency(from: number, dir: Direction, to: number) {
    let fromMap = this.adjacent.get(from);
    if (!fromMap) {
      fromMap = new Map();
      this.adjacent.set(from, fromMap);
    }
    let dirAdj = fromMap.get(dir);
    if (!dirAdj) {
      dirAdj = new Set();
      fromMap.set(dir, dirAdj);
    }
    dirAdj.add(to);
  }

  isAdjacent(t1: number, dir: Direction, t2: number): boolean {
    return this.adjacent.get(t1)?.get(dir)?.has(t2) || false;
  }

  addCompatible(from: number, dir: Direction, to: number) {
    let fromMap = this.compatible.get(from);
    if (!fromMap) {
      fromMap = new Map();
      this.compatible.set(from, fromMap);
    }
    let dirCompat = fromMap.get(dir);
    if (!dirCompat) {
      dirCompat = new Set();
      fromMap.set(dir, dirCompat);
    }
    dirCompat.add(to);
  }

  canOverlap(pattern1: number, pattern2: number, dx: number, dy: number): boolean {
    const p1 = this.patterns[pattern1];
    const p2 = this.patterns[pattern2];
    for (let x = 0; x < this.patternSize; x++) {
      for (let y = 0; y < this.patternSize; y++) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || nx >= this.patternSize || ny < 0 || ny >= this.patternSize) continue;
        const i = this.indexPattern(x, y);
        const j = this.indexPattern(nx, ny);
        if (p1[i] !== p2[j]) return false;
      }
    }
    return true;
  }

  async generate(): Promise<Tilemap> {
    const cells = `cell(0..${this.targetWidth - 1},0..${this.targetHeight - 1}).`;
    const adj: string[] = [];
    for (let x = 0; x < this.targetWidth; x++) {
      for (let y = 0; y < this.targetHeight; y++) {
        for (let delta of this.neighbors.values()) {
          const [nx, ny] = [x + delta.x, y + delta.y];
          if (nx < 0 || nx >= this.targetWidth || ny < 0 || ny >= this.targetHeight) continue;
          adj.push(`adj(${x},${y},${nx},${ny},${delta.x},${delta.y}).`);
        }
      }
    }

    const patterns = `pattern(0..${this.patterns.length}).`;
    const legal: string[] = [];
    for (let [p1, directions] of this.adjacent.entries()) {
      for (let [direction, patterns] of directions.entries()) {
        const delta = this.neighbors.get(direction);
        if (delta === undefined) throw Error(`No delta found for direction ${direction}`);
        for (let p2 of patterns) {
          legal.push(`legal(${delta.x},${delta.y},${p1},${p2}).`);
        }
      }
    }

    const resp = await ClingoService.RunProgram({
      Program: [
        cells,
        ...adj,
        patterns,
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
        for (let layer of newTilemap.layers) {
          layer.data = new Array(this.targetWidth * this.targetHeight);
          layer.width = this.targetWidth;
          layer.height = this.targetHeight;
        }

        for (let atom of atoms) {
          const match = atom.match(/assign\((\d+),\W*(\d+),\W*(\d+)\)/);
          if (match === null) throw new Error(`No match found for ${atom}`);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [x, y, p, _] = match.slice(1).map(x => parseInt(x));
          this.tiles[p].split(',').map(x => parseInt(x)).forEach((tile, layer) => {
            const data = newTilemap.layers[layer].data;
            if (!data) return;
            data[y * this.targetWidth + x] = tile;
          });
        }

        resolve(newTilemap);
      } else {
        console.log(match);
        reject(resp.Stderr);
      }
    });
  }

}