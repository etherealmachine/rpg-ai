import { Tilemap } from './Tiled';
import MinHeap from './MinHeap';

class Contradiction extends Error {

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
    /*
    this.tilemap.layers.forEach(layer => {
      layer.data = new Array(W * H);
    });
    */
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        this.possibilities[y * W + x] = new Set<number>();
        if (this.tileAt(x, y) !== undefined) continue;
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

  step(): boolean {
    let minEntropy: number | undefined = undefined;
    while (minEntropy === undefined || this.entropy[minEntropy] === undefined) {
      if (this.entropyHeap.empty()) return true;
      minEntropy = this.entropyHeap.pop();
    }
    const loc = minEntropy as number;
    const selection = this.lottery(this.possibilities[loc]);
    this.startTrace();
    try {
      this.collapse(loc, selection, 0);
    } catch (e) {
      if (e instanceof Contradiction) {
        const trace = this.traces.pop();
        if (!trace) throw e;
        for (let traceLoc in trace) {
          for (let removed of trace[traceLoc].removed) {
            this.possibilities[traceLoc].add(removed);
          }
          if (trace[traceLoc].collapsed) this.setTileAtLoc(traceLoc as unknown as number, undefined);
        }
        this.possibilities[loc].delete(selection);
        if (this.updateEntropy(loc) === undefined) throw e;
      } else {
        throw e;
      }
    }
    while (this.entropyHeap.peek() === undefined) {
      this.entropyHeap.pop();
    }
    return false;
  }

  collapse(loc: number, tile: number, level: number) {
    this.setTileAtLoc(loc, tile);
    this.trace(loc, new Set<number>(...this.possibilities), tile);
    this.possibilities[loc].clear();
    this.entropy[loc] = undefined;
    for (let { loc: neighborLoc, dir: neighborDir } of this.eachNeighbor(loc)) {
      this.propagate(loc, neighborLoc, neighborDir, 0);
    }
  }

  propagate(neighborLoc: number, loc: number, dir: string, level: number) {
    if (this.possibilities[loc].size === 0) return;
    let neighborPossibilities = this.possibilities[neighborLoc];
    if (neighborPossibilities.size === 0) {
      const neighborTile = this.tileAtLoc(neighborLoc);
      if (neighborTile === undefined) throw new Contradiction(`neighbor ${neighborLoc} has zero possibilities but is not set`);
      neighborPossibilities = new Set<number>([neighborTile]);
    }
    const removed = new Set<number>();
    for (let possibleTile of this.possibilities[loc]) {
      let stillPossible = false;
      for (let possibleNeighborTile of neighborPossibilities) {
        stillPossible = stillPossible || this.validConnection(possibleNeighborTile, dir, possibleTile);
      }
      if (!stillPossible) {
        this.possibilities[loc].delete(possibleTile);
        removed.add(possibleTile);
      }
    }
    if (removed.size === 0) return;
    this.trace(loc, removed);
    if (this.possibilities[loc].size === 1) {
      this.collapse(loc, this.possibilities[loc].values().next().value, level + 1);
    } else {
      for (let { loc: neighborLoc, dir: neighborDir } of this.eachNeighbor(loc)) {
        this.propagate(loc, neighborLoc, neighborDir, level + 1);
      }
    }
    if (this.updateEntropy(loc) === undefined) throw new Contradiction('contradiction found during propagation');
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

  traces: { [key: number]: { removed: Set<number>, collapsed?: number } }[] = []
  startTrace() {
    this.traces.push({});
  }

  trace(loc: number, removed: Set<number>, collapsed?: number) {
    const trace = this.traces[this.traces.length - 1];
    if (trace[loc] === undefined) {
      trace[loc] = { removed, collapsed };
      return;
    }
    for (let tile of removed) {
      trace[loc].removed.add(tile);
    }
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