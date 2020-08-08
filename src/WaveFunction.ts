import { Tilemap } from './Tiled';

class Tile {
  layers: number[]
  hash: string

  constructor(layers: number[]) {
    this.layers = layers;
    this.hash = layers.join(':');
  }

  static fromHash(hash: string): Tile {
    return new Tile(hash.split(':').map(t => parseInt(t)));
  }
}

export default class WaveFunction {

  tilemap: Tilemap
  tiles: (Tile | undefined)[] = [];
  weights: { [key: string]: number } = {}
  connections: { [key: string]: { [key: string]: { [key: string]: number } } } = {}
  entropy: (number | undefined)[] = []
  possibilities: Tile[][] = []
  decisionStack: { index: number, tile: Tile, rejectionStack: { index: number, rejections: Tile[] }[] }[] = []
  neighbors = [
    { dir: 'north', x: 0, y: -1 },
    { dir: 'east', x: 1, y: 0 },
    { dir: 'south', x: 0, y: 1 },
    { dir: 'west', x: -1, y: 0 },
  ]

  constructor(tilemap: Tilemap) {
    this.tilemap = tilemap;
    this.parseTuples();
    this.clear();
    this.initializePossibilities();
    this.initializeEntropy();
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
        if (tile.layers.reduce((sum, e) => sum + e, 0) === 0) {
          this.tiles.push(undefined);
        } else {
          this.tiles.push(tile);
        }
        if (this.weights[tile.hash] === undefined) this.weights[tile.hash] = 0;
        this.weights[tile.hash]++;
      }
    }

    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const t = this.tiles[y * W + x];
        if (t === undefined) continue;
        for (let neighbor of this.neighbors) {
          const nx = x + neighbor.x;
          const ny = y + neighbor.y;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const n = this.tiles[ny * W + nx];
            if (n === undefined) continue;
            this.incrementConnection(t.hash, neighbor.dir, n.hash);
            this.incrementConnection(n.hash, WaveFunction.inverseDir(neighbor.dir), t.hash);
          }
        }
      }
    }
  }

  incrementConnection(a: string, dir: string, b: string) {
    if (this.connections[a] === undefined) this.connections[a] = {};
    if (this.connections[a][dir] === undefined) this.connections[a][dir] = {};
    if (this.connections[a][dir][b] === undefined) this.connections[a][dir][b] = 0;
    this.connections[a][dir][b]++;
  }

  clear() {
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    this.tiles = new Array(W * H);
    this.tilemap.layers.forEach(layer => {
      layer.data = new Array(W * H);
    });
  }

  initializePossibilities() {
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let possibilities = new Set(Object.keys(this.weights));
        for (let neighbor of this.neighbors) {
          const nx = x + neighbor.x;
          const ny = y + neighbor.y;
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
          const n = this.tiles[ny * W + nx];
          if (n === undefined) continue;
          for (let hash of possibilities) {
            if (this.invalidConnection(n.hash, WaveFunction.inverseDir(neighbor.dir), hash)) {
              possibilities.delete(hash);
            }
          }
        }
        const t = this.tiles[y * W + x];
        if (t === undefined) {
          this.possibilities.push(Array.from(possibilities).map(hash => Tile.fromHash(hash)));
        } else {
          this.possibilities.push([]);
        }
      }
    }
  }

  initializeEntropy() {
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    this.entropy = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const possibilities = this.possibilities[y * W + x];
        if (possibilities.length === 0) {
          this.entropy.push(undefined);
        } else if (possibilities.length === 1) {
          this.entropy.push(0);
        } else {
          const sum = possibilities.reduce((sum, t) => sum + this.weights[t.hash], 0);
          const logSum = possibilities.reduce((sum, t) => sum + this.weights[t.hash] * Math.log(this.weights[t.hash]), 0);
          this.entropy.push(Math.log(sum) - logSum / sum);
        }
      }
    }
  }

  step() {
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    const minEntropy = this.entropy.reduce((min: number, e) => e === undefined ? min : Math.min(min, e), Infinity);
    const i = this.entropy.indexOf(minEntropy);
    if (i === -1) {
      return true;
    }
    const selection = this.lottery(this.possibilities[i].map(t => ({ hash: t.hash, count: this.weights[t.hash] })));
    const tile = Tile.fromHash(selection.hash);
    this.tiles[i] = tile
    this.entropy[i] = undefined;
    const rejectionStack: { index: number, rejections: Tile[] }[] = [];
    this.decisionStack.push({ index: i, tile: tile, rejectionStack: rejectionStack });
    tile.layers.forEach((tileIndex, layerIndex) => {
      this.tilemap.layers[layerIndex].data![i] = tileIndex;
    });
    this.possibilities[i] = [];
    const [x, y] = [i % W, Math.floor(i / W)];
    for (let neighbor of this.neighbors) {
      const nx = x + neighbor.x;
      const ny = y + neighbor.y;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const ni = ny * W + nx;
      if (this.entropy[ni] === undefined) continue;
      const possibilities = this.possibilities[ni];
      const rejections = possibilities.filter(n => this.invalidConnection(tile.hash, neighbor.dir, n.hash));
      rejections.forEach(rejection => possibilities.splice(possibilities.indexOf(rejection), 1));
      rejectionStack.push({ index: ni, rejections: rejections });
      this.entropy[ni] = this.calculateEntropy(ni);
      if (this.entropy[ni] === undefined) {
        return false;
      }
    }
    return true;
  }

  calculateEntropy(i: number) {
    const possibilities = this.possibilities[i];
    if (possibilities.length === 0) {
      return undefined;
    } else if (possibilities.length === 1) {
      return 0;
    }
    const sum = possibilities.reduce((sum, t) => sum + this.weights[t.hash], 0);
    const logSum = possibilities.reduce((sum, t) => sum + this.weights[t.hash] * Math.log(this.weights[t.hash]), 0);
    return Math.log(sum) - logSum / sum;
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