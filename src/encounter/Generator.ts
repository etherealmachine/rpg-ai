import ClingoService from '../ClingoService';

import { Tilemap } from '../Tiled';

const Program = `
1 { assign(X,Y,Z,P):pattern(P) } 1 :- cell(X,Y,Z).
:- adj(X1,Y1,Z1,X2,Y2,Z1,DX,DY,DZ),
assign(X1,Y1,Z1,P1),
not 1 { assign(X2,Y2,Z2,P2):legal(DX,DY,DZ,P1,P2) }.

#show assign/4.
`;

type Pattern = number[]

enum Direction {
  Left = 'Left',
  Right = 'Right',
  Up = 'Up',
  Down = 'Down',
  Above = 'Above',
  Below = 'Below',
}

export default class Generator {

  tilemap: Tilemap
  tiles: number[] = []
  patternSize: number
  patterns: Pattern[] = []
  patternIndex: Map<number, number> = new Map()
  weights: number[] = []
  adjacent: Map<number, Map<Direction, Set<number>>> = new Map()
  compatible: Map<number, Map<Direction, Set<number>>> = new Map()
  neighbors: Map<Direction, { x: number, y: number, z: number }> = new Map([
    [Direction.Left, { x: -1, y: 0, z: 0 }],
    [Direction.Right, { x: 1, y: 0, z: 0 }],
    [Direction.Up, { x: 0, y: -1, z: 0 }],
    [Direction.Down, { x: 0, y: 1, z: 0 }],
    [Direction.Above, { x: 0, y: 0, z: 1 }],
    [Direction.Below, { x: 0, y: 0, z: -1 }],
  ])
  targetWidth: number
  targetHeight: number

  constructor(tilemap: Tilemap, patternSize: number, width: number, height: number) {
    this.tilemap = tilemap;
    this.patternSize = patternSize;
    this.targetWidth = width;
    this.targetHeight = height;

    const tileset = new Set<number>();
    for (let z = 0; z < this.tilemap.layers.length; z++) {
      for (let y = 0; y < this.tilemap.height; y++) {
        for (let x = 0; x < this.tilemap.width; x++) {
          const tile = this.tileAt(x, y, z);
          if (tile) tileset.add(tile);
        }
      }
    }
    this.tiles = new Array(...tileset);
    for (let x = 0; x < this.tilemap.width; x++) {
      for (let y = 0; y < this.tilemap.height; y++) {
        for (let z = 0; z < this.tilemap.layers.length; z++) {
          const pattern = [];
          for (let dx = 0; dx < patternSize; dx++) {
            for (let dy = 0; dy < patternSize; dy++) {
              for (let dz = 0; dz < patternSize; dz++) {
                const [nx, ny, nz] = [x + dx, y + dy, z + dz];
                const tile = this.tileAt(nx, ny, nz);
                pattern.push(tile);
              }
            }
          }
          if (pattern.indexOf(undefined) !== -1) continue;
          if (pattern.reduce((sum, x) => (sum || 0) + (x || 0), 0) === 0) continue;
          const patternString = pattern.join(',');
          let patternIndex = this.patterns.findIndex(p => p.join(',') === patternString);
          const mapIndex = this.index(x, y, z);
          if (patternIndex === -1) {
            this.patterns.push(pattern as Pattern);
            this.weights.push(1);
            patternIndex = this.patterns.length - 1;
          } else {
            this.patternIndex.set(mapIndex, patternIndex);
            this.weights[patternIndex]++;
          }
          this.patternIndex.set(mapIndex, patternIndex);
        }
      }
    }
    for (let x = 0; x < this.tilemap.width; x++) {
      for (let y = 0; y < this.tilemap.height; y++) {
        for (let z = 0; z < this.tilemap.layers.length; z++) {
          const tile = this.tileAt(x, y, z);
          for (let [dir, delta] of this.neighbors.entries()) {
            const [nx, ny, nz] = [x + delta.x, y + delta.y, z + delta.z];
            const neighbor = this.tileAt(nx, ny, nz);
            if (tile !== undefined && neighbor !== undefined && tile !== 0 && neighbor !== 0) {
              this.addAdjacency(tile, dir, neighbor);
              this.addAdjacency(neighbor, this.inverse(dir), tile);
            }
          }
        }
      }
    }
    for (let i = 0; i < this.patterns.length; i++) {
      for (let j = 0; j < this.patterns.length; j++) {
        for (let [dir, delta] of this.neighbors.entries()) {
          if (this.canOverlap(i, j, delta.x, delta.y, delta.z)) {
            this.addCompatible(i, dir, j);
            this.addCompatible(j, this.inverse(dir), i);
          }
        }
      }
    }
  }

  index(x: number, y: number, z: number): number {
    return z + y * this.tilemap.height + x * this.tilemap.width * this.tilemap.height;
  }

  indexPattern(x: number, y: number, z: number): number {
    return z + y * this.patternSize + x * this.patternSize * this.patternSize;
  }

  inverse(d: Direction): Direction {
    switch (d) {
      case Direction.Left: return Direction.Right;
      case Direction.Right: return Direction.Left;
      case Direction.Up: return Direction.Down;
      case Direction.Down: return Direction.Up;
      case Direction.Above: return Direction.Below;
      case Direction.Below: return Direction.Above;
    }
  }

  tileAt(x: number, y: number, z: number): number | undefined {
    if (x < 0 || x >= this.tilemap.width || y < 0 || y >= this.tilemap.height || z < 0 || z >= this.tilemap.layers.length) return undefined;
    const data = this.tilemap.layers[z].data;
    if (data) return data[y * this.tilemap.width + x];
    return undefined;
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

  canOverlap(pattern1: number, pattern2: number, dx: number, dy: number, dz: number): boolean {
    const p1 = this.patterns[pattern1];
    const p2 = this.patterns[pattern2];
    for (let x = 0; x < this.patternSize; x++) {
      for (let y = 0; y < this.patternSize; y++) {
        for (let z = 0; z < this.patternSize; z++) {
          const [nx, ny, nz] = [x + dx, y + dy, z + dz];
          if (nx < 0 || nx >= this.patternSize || ny < 0 || ny >= this.patternSize || nz < 0 || nz >= this.patternSize) continue;
          const i = this.indexPattern(x, y, z);
          const j = this.indexPattern(nx, ny, nz);
          for (let [dir, delta] of this.neighbors.entries()) {
            if (delta.x === dx && delta.y === dy && delta.x === dz) {
              if (!this.isAdjacent(i, dir, j)) return false;
            }
          }
          if (p1[i] !== p2[j]) return false;
        }
      }
    }
    return true;
  }

  async generate(): Promise<Tilemap> {
    const patterns = `pattern(0..${this.patterns.length - 1}).`;
    const cells = `cell(0..${this.targetWidth - 1},0..${this.targetHeight - 1},0..${this.tilemap.layers.length - 1}).`;
    const adj: string[] = [];
    for (let x = 0; x < this.targetWidth; x++) {
      for (let y = 0; y < this.targetHeight; y++) {
        for (let z = 0; z < this.tilemap.layers.length; z++) {
          for (let delta of this.neighbors.values()) {
            const [nx, ny, nz] = [x + delta.x, y + delta.y, z + delta.z];
            if (nx < 0 || nx >= this.targetWidth || ny < 0 || ny >= this.targetHeight || nz < 0 || nz >= this.tilemap.layers.length) continue;
            adj.push(`adj(${x}, ${y}, ${z}, ${nx}, ${ny}, ${nz}, ${delta.x}, ${delta.y}, ${delta.z}).`);
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
          legal.push(`legal(${delta.x}, ${delta.y}, ${delta.z}, ${p1}, ${p2}).`)
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
        for (let layer of newTilemap.layers) {
          layer.data = new Array(this.targetWidth * this.targetHeight);
          layer.width = this.targetWidth;
          layer.height = this.targetHeight;
        }

        for (let atom of atoms) {
          const match = atom.match(/assign\((\d+),\W*(\d+),\W*(\d+),\W*(\d+)\)/);
          if (match === null) throw new Error(`No match found for ${atom}`);
          const [x, y, z, p] = match.slice(1).map(x => parseInt(x));
          const data = newTilemap.layers[z].data;
          if (!data) continue;
          data[y * this.targetWidth + x] = this.tiles[p];
        }

        resolve(newTilemap);
      } else {
        console.log(match);
        reject(resp.Stderr);
      }
    });
  }

}