import { Tilemap } from './Tiled';
import MinHeap from './MinHeap';

interface Collapse {
  loc: number
  tile: number
  possibilities: Set<number>
}

interface Propagation {
  loc: number
  removedTiles: Set<number>
}

class Trace {

  collapses: Collapse[] = []
  propagations: Propagation[] = []

  addCollapse(loc: number, tile: number, possibilities: Set<number>) {
    this.collapses.push({ loc: loc, tile: tile, possibilities: possibilities });
  }

  addPropagation(loc: number, removedTiles: Set<number>) {
    this.propagations.push({ loc: loc, removedTiles: removedTiles });
  }

}

export default class WaveFunction {

  tilemap: Tilemap
  tiles: string[] = []
  weights: number[] = []
  connections: { [key: number]: { [key: string]: { [key: number]: boolean } } } = {}
  entropy: (number | undefined)[] = []
  entropyHeap: MinHeap<number> = new MinHeap<number>()
  possibilities: Set<number>[] = []
  neighbors = [
    { dir: 'north', x: 0, y: -1 },
    { dir: 'east', x: 1, y: 0 },
    { dir: 'south', x: 0, y: 1 },
    { dir: 'west', x: -1, y: 0 },
  ]

  constructor(tilemap: Tilemap) {
    this.tilemap = tilemap;
    this.parseTuples();
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
    this.weights = new Array(this.tiles.length).fill(0);

    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const t = this.tileAt(x, y);
        if (t === undefined) continue;
        this.weights[t]++;
        for (let neighbor of this.neighbors) {
          const nx = x + neighbor.x;
          const ny = y + neighbor.y;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const n = this.tileAt(nx, ny);
            if (n === undefined) continue;
            this.addConnection(t, neighbor.dir, n);
            this.addConnection(n, WaveFunction.inverseDir(neighbor.dir), t);
          }
        }
      }
    }
  }

  tileAt(x: number, y: number): number | undefined {
    const layers = this.tilemap.layers.filter(layer => layer.data).map(layer => layer.data) as number[][];
    if (layers.filter(layer => layer[y * this.tilemap.width + x] > 0).length === 0) return undefined;
    return this.tiles.indexOf(layers.map(layer => layer[y * this.tilemap.width + x]).join(','));
  }

  tileAtLoc(loc: number): number | undefined {
    const W = this.tilemap.width;
    const [x, y] = [loc % W, Math.floor(loc / W)];
    return this.tileAt(x, y);
  }

  setTileAtLoc(loc: number, tile: number) {
    this.tiles[tile].split(',').forEach((tileIndex, layerIndex) => {
      this.tilemap.layers[layerIndex].data![loc] = parseInt(tileIndex);
    });
  }

  addConnection(a: number, dir: string, b: number) {
    if (this.connections[a] === undefined) this.connections[a] = {};
    if (this.connections[a][dir] === undefined) this.connections[a][dir] = {};
    if (this.connections[a][dir][b] === undefined) this.connections[a][dir][b] = true;
  }

  initializePossibilities() {
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    this.tilemap.layers.forEach(layer => {
      layer.data = new Array(W * H);
    });
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        this.possibilities[y * W + x] = new Set<number>();
        for (let i = 0; i < this.weights.length; i++) {
          this.possibilities[y * W + x].add(i);
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
        const entropy = this.calculateEntropy(y * W + x);
        this.entropy.push(entropy);
        if (entropy !== undefined) {
          this.entropyHeap.insert(entropy, y * W + x);
        }
      }
    }
  }

  step() {
    let minEntropy: number | undefined = undefined;
    while (minEntropy === undefined || this.entropy[minEntropy] === undefined) {
      if (this.entropyHeap.empty()) return true;
      minEntropy = this.entropyHeap.pop();
    }
    const loc = minEntropy as number;
    const selection = this.lottery(this.possibilities[loc]);
    return this.collapse(loc, selection, new Trace());
  }

  collapse(loc: number, tile: number, trace: Trace): boolean {
    this.setTileAtLoc(loc, tile);
    trace.addCollapse(loc, tile, new Set(this.possibilities[loc]));
    this.possibilities[loc].clear();
    this.entropy[loc] = undefined;
    for (let { loc: neighborLoc, dir: neighborDir } of this.eachNeighbor(loc)) {
      if (!this.propagate(tile, neighborLoc, neighborDir, trace)) {
        return false;
      }
    }
    return true;
  }

  propagate(tile: number, neighborLoc: number, neighborDir: string, trace: Trace): boolean {
    if (this.possibilities[neighborLoc].size === 0) return true;
    const removed = new Set<number>();
    for (let possibleTile of this.possibilities[neighborLoc]) {
      if (this.invalidConnection(tile, neighborDir, possibleTile)) {
        this.possibilities[neighborLoc].delete(possibleTile);
        removed.add(possibleTile);
      }
    }
    trace.addPropagation(neighborLoc, removed);
    if (this.possibilities[neighborLoc].size === 1) {
      this.collapse(neighborLoc, this.possibilities[neighborLoc].values().next().value, trace);
    } else if (this.possibilities[neighborLoc].size === 0) {
      this.undo(trace);
      return false;
    } else {
      this.updateEntropy(neighborLoc);
    }
    return true;
  }

  undo(trace: Trace) {
    for (let propagation of trace.propagations) {
      for (let removedTile of propagation.removedTiles) {
        this.possibilities[propagation.loc].add(removedTile);
      }
      this.updateEntropy(propagation.loc);
    }
    for (let collapse of trace.collapses) {
      this.setTileAtLoc(collapse.loc, 0);
      this.possibilities[collapse.loc] = collapse.possibilities;
      this.updateEntropy(collapse.loc);
    }
  }

  *eachNeighbor(loc: number) {
    const W = this.tilemap.width;
    const H = this.tilemap.height;
    const [x, y] = [loc % W, Math.floor(loc / W)];
    for (let neighbor of this.neighbors) {
      const nx = x + neighbor.x;
      const ny = y + neighbor.y;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      yield { loc: ny * W + nx, dir: neighbor.dir };
    }
  }

  updateEntropy(i: number): number {
    const newEntropy = this.calculateEntropy(i);
    this.entropy[i] = newEntropy;
    if (newEntropy === undefined) {
      throw new Error('entropy undefined');
    }
    this.entropyHeap.insert(newEntropy, i);
    return newEntropy;
  }

  calculateEntropy(i: number): number | undefined {
    let sum = 0;
    let sumOfLogs = 0;
    for (let t of this.possibilities[i]) {
      sum += this.weights[t];
      sumOfLogs += this.weights[t] * Math.log(this.weights[t]);
    }
    if (sum === 0) return undefined;
    return Math.log(sum) - sumOfLogs / sum + 0.000001 * Math.random();
  }

  invalidConnection(t: number, dir: string, n: number): boolean {
    if (this.connections[t] === undefined) return false;
    if (this.connections[t][dir] === undefined) return false;
    return this.connections[t][dir][n] === undefined;
  }

  lottery(tileset: Set<number>): number {
    let sum = 0;
    for (let t of tileset.values()) {
      sum += this.weights[t];
    }
    const selected = Math.random() * sum;
    let total = 0;
    for (let i of tileset) {
      total += this.weights[i];
      if (selected <= total) {
        return i;
      }
    }
    throw new Error('lottery failed');
  }

}