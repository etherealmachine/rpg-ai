import { Tilemap } from './Tiled';

class Tile {
  layers: number[]
  hash: string
  empty: boolean

  constructor(layers: number[]) {
    this.layers = layers;
    this.hash = layers.join(':');
    this.empty = layers.reduce((sum, t) => sum + t, 0) === 0;
  }

  static fromHash(hash: string): Tile {
    return new Tile(hash.split(':').map(t => parseInt(t)));
  }
}

export default class WaveFunction {

  tilemap: Tilemap
  tiles: Tile[] = [];
  hashCounts: { [key: string]: number } = {}
  connections: { [key: string]: { [key: string]: { [key: string]: number } } } = {}
  entropy: number[] = []
  possibilities: Tile[][] = []
  neighbors = [
    { dir: 'north', x: 0, y: -1 },
    { dir: 'east', x: 1, y: 0 },
    { dir: 'south', x: 0, y: 1 },
    { dir: 'west', x: -1, y: 0 },
  ]

  constructor(tilemap: Tilemap) {
    this.tilemap = tilemap;
    this.parseTuples();
    this.calculateEntropy();
  }

  static inverseDir(dir: string): string {
    switch (dir) {
      case 'north': return 'south'
      case 'south': return 'north'
      case 'east': return 'west'
      case 'west': return 'east'
    }
    throw new Error(`invalid direction ${dir}`);
  }

  parseTuples() {
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    const layers = this.tilemap.layers.filter(layer => layer.data).map(layer => layer.data) as number[][];

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const tile = new Tile(layers.map(layer => layer[y * W + x]));
        this.tiles.push(tile);
        if (tile.empty) {
          this.hashCounts[tile.hash] = 1;
          continue;
        }
        if (this.hashCounts[tile.hash] === undefined) this.hashCounts[tile.hash] = 0;
        this.hashCounts[tile.hash]++;
      }
    }

    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const t = this.tiles[y * W + x];
        if (t.layers[0] === 0) continue;
        if (this.connections[t.hash] === undefined) this.connections[t.hash] = {};
        for (let neighbor of this.neighbors) {
          if (this.connections[t.hash][neighbor.dir] === undefined) this.connections[t.hash][neighbor.dir] = {};
          const nx = x + neighbor.x;
          const ny = y + neighbor.y;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const n = this.tiles[ny * W + nx];
            if (this.connections[t.hash][neighbor.dir][n.hash] === undefined) this.connections[t.hash][neighbor.dir][n.hash] = 0;
            this.connections[t.hash][neighbor.dir][n.hash]++;
          }
        }
      }
    }

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let possibilities = new Set(Object.keys(this.hashCounts));
        let emptyNeighbor = false;
        for (let neighbor of this.neighbors) {
          const nx = x + neighbor.x;
          const ny = y + neighbor.y;
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
          const n = this.tiles[ny * W + nx];
          if (n.empty) emptyNeighbor = true;
          for (let hash of possibilities) {
            if (this.invalidConnection(n.hash, WaveFunction.inverseDir(neighbor.dir), hash)) {
              possibilities.delete(hash);
            }
          }
        }
        const t = this.tiles[y * W + x];
        if (t.empty || emptyNeighbor) {
          this.possibilities.push(Array.from(possibilities).map(hash => Tile.fromHash(hash)));
        } else {
          this.possibilities.push([]);
        }
      }
    }
  }

  calculateEntropy() {
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    this.entropy = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (this.possibilities.length === 0) {
          this.entropy.push(0);
        } else {
          const sum = this.possibilities[y * W + x].reduce((sum, t) => sum + this.hashCounts[t.hash], 0);
          const logSum = this.possibilities[y * W + x].reduce((sum, t) => sum + this.hashCounts[t.hash] * Math.log(this.hashCounts[t.hash]), 0);
          this.entropy.push(Math.log(sum) - logSum / sum);
        }
      }
    }
  }

  stepCollapse() {
    this.calculateEntropy();
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    const minEntropy = this.entropy.reduce((min, e) => {
      if (e > 0 && e < min) return e;
      return min
    }, Infinity);
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const e = this.entropy[y * W + x];
        if (e === minEntropy) {
          const selection = this.lottery(this.possibilities[y * W + x].map(t => ({ hash: t.hash, count: this.hashCounts[t.hash] })));
          const tile = Tile.fromHash(selection.hash);
          this.tiles[y * W + x] = tile
          tile.layers.forEach((tileIndex, layerIndex) => {
            this.tilemap.layers[layerIndex].data![y * W + x] = tileIndex;
          });
          this.possibilities[y * W + x] = [];
          for (let neighbor of this.neighbors) {
            const nx = x + neighbor.x;
            const ny = y + neighbor.y;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            const possibilities = this.possibilities[ny * W + nx];
            const rejections = possibilities.filter(n => this.invalidConnection(tile.hash, neighbor.dir, n.hash));
            rejections.forEach(rejection => possibilities.splice(possibilities.indexOf(rejection), 1));
          }
          return;
        }
      }
    }
  }

  invalidConnection(t: string, dir: string, n: string): boolean {
    if (this.connections[t] === undefined) return false;
    if (this.connections[t][dir] === undefined) return false;
    return this.connections[t][dir][n] === undefined;
  }

  lottery(arr: { hash: string, count: number }[]) {
    const sum = arr.reduce((acc, h) => acc + h.count, 0);
    const selected = Math.random() * sum;
    let total = 0;
    let winner = -1;
    for (let i = 0; i < arr.length; i++) {
      total += arr[i].count;
      if (selected <= total) {
        winner = i;
        break;
      }
    }
    return arr[winner];
  }

}