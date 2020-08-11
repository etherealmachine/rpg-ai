import { Tilemap } from './Tiled';
import MinHeap from './MinHeap';

interface Collapse {
  loc: number
  tile: number
  possibilities: Set<number>
  propagations: Propagation[]
  contradiction?: boolean
}

interface Propagation {
  loc: number
  removed: Set<number>
}

export default class WaveFunction {

  tilemap: Tilemap
  tiles: string[] = []
  weights: number[] = []
  connections: { [key: number]: { [key: string]: { [key: number]: boolean } } } = {}
  entropy: (number | undefined)[] = []
  entropyHeap: MinHeap<number> = new MinHeap<number>()
  possibilities: Set<number>[] = []
  traces: Collapse[] = []
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
    const layers = this.tilemap.layers.filter(layer => layer.type === 'tilelayer').map(layer => layer.data) as number[][];

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
    const layers = this.tilemap.layers.filter(layer => layer.type === 'tilelayer').map(layer => layer.data) as number[][];
    if (layers.filter(layer => layer[y * this.tilemap.width + x] > 0).length === 0) return undefined;
    return this.tiles.indexOf(layers.map(layer => layer[y * this.tilemap.width + x]).join(','));
  }

  tileAtLoc(loc: number): number | undefined {
    const W = this.tilemap.width;
    const [x, y] = [loc % W, Math.floor(loc / W)];
    return this.tileAt(x, y);
  }

  setTileAtLoc(loc: number, tile: number | undefined) {
    if (tile === undefined) {
      for (let layer of this.tilemap.layers) {
        if (layer.type === 'tilelayer' && layer.data !== undefined) layer.data[loc] = 0;
      }
      return;
    }
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

  generate() {
    while (!this.entropyHeap.empty()) {
      this.step();
    }
  }

  step() {
    const contradictions = this.possibilities.filter((possibilities, loc) => possibilities.size === 0 && this.tileAtLoc(loc) === undefined);
    if (contradictions.length > 0) {
      return;
    }
    let minEntropy: number | undefined = undefined;
    while (minEntropy === undefined || this.entropy[minEntropy] === undefined) {
      if (this.entropyHeap.empty()) return true;
      minEntropy = this.entropyHeap.pop();
    }
    const loc = minEntropy as number;
    const selection = this.lottery(this.possibilities[loc]);
    const trace = this.collapse(loc, selection);
    this.traces.push(trace);
    if (trace.contradiction) {
      this.traces.pop();
      this.undo(trace);
    }
  }

  collapse(loc: number, tile: number): Collapse {
    const trace: Collapse = { loc: loc, tile: tile, possibilities: new Set(this.possibilities[loc]), propagations: [] };
    this.setTileAtLoc(loc, tile);
    this.possibilities[loc].clear();
    this.entropy[loc] = undefined;
    for (let { loc: neighborLoc, dir: neighborDir } of this.eachNeighbor(loc)) {
      this.propagate(tile, neighborLoc, neighborDir, trace);
      if (trace.contradiction) return trace;
    }
    return trace;
  }

  propagate(tile: number, neighborLoc: number, neighborDir: string, trace: Collapse) {
    if (this.possibilities[neighborLoc].size === 0) return false;
    const removed = new Set<number>();
    for (let possibleTile of this.possibilities[neighborLoc]) {
      if (!this.validConnection(tile, neighborDir, possibleTile)) {
        this.possibilities[neighborLoc].delete(possibleTile);
        removed.add(possibleTile);
      }
    }
    trace.propagations.push({ loc: neighborLoc, removed: removed });
    if (this.possibilities[neighborLoc].size === 1) {
      let subTrace = this.collapse(neighborLoc, this.possibilities[neighborLoc].values().next().value);
      this.traces.push(trace);
      if (subTrace.contradiction) {
        this.traces.pop();
        this.undo(subTrace);
        trace.contradiction = true;
      }
    }
    if (this.updateEntropy(neighborLoc) === undefined) trace.contradiction = true;
  }

  undo(collapse: Collapse) {
    this.possibilities[collapse.loc] = collapse.possibilities;
    this.possibilities[collapse.loc].delete(collapse.tile);
    this.setTileAtLoc(collapse.loc, undefined);
    if (this.possibilities[collapse.loc].size === 0) {
      this.possibilities[collapse.loc] = collapse.possibilities;
      const trace = this.traces.pop();
      if (trace === undefined) throw new Error('ran out of traces trying to backup');
      this.undo(trace);
    }
    let contradiction = this.updateEntropy(collapse.loc) === undefined;
    for (let propagation of collapse.propagations) {
      for (let removed of propagation.removed) {
        this.possibilities[propagation.loc].add(removed);
      }
      if (this.updateEntropy(propagation.loc) === undefined) contradiction = true;
    }
    if (contradiction) {
      const trace = this.traces.pop();
      if (trace === undefined) throw new Error('ran out of traces trying to backup');
      this.undo(trace);
    }
  }

  updateEntropy(loc: number): number | undefined {
    const newEntropy = this.calculateEntropy(loc);
    this.entropy[loc] = newEntropy;
    if (newEntropy !== undefined) {
      this.entropyHeap.insert(newEntropy, loc);
    }
    return newEntropy;
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

  validConnection(t: number, dir: string, n: number): boolean {
    if (this.connections[t] === undefined) return false;
    if (this.connections[t][dir] === undefined) return false;
    return this.connections[t][dir][n] !== undefined;
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