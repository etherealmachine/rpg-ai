import MinHeap from './MinHeap';
import { Tilemap, TilemapLayer } from '../Tiled';

class Contradiction extends Error {

}

export type Pattern = number[]

export enum Direction {
  Left = 'left',
  Right = 'right',
  Up = 'up',
  Down = 'down'
}

export interface PatternParser {
  tilemap: Tilemap
  tiles: string[]
  patternSize: number
  patterns: Pattern[]
  weights: number[]
  adjacent: Map<number, Map<Direction, Map<number, boolean>>>
  neighbors: Map<Direction, { x: number, y: number }>
}

export default class Generator {

  // parser has the parsed patterns and adjacency rules
  parser: PatternParser
  // width and height of the generated map
  width: number
  height: number

  // possibilities has the set of possible Patterns at every location
  possibilities: Set<number>[] = []

  // entropy has the Shannon entropy calculated from the number of possibilities at each location 
  entropy: number[] = []
  // entropyHeap is a priority queue sorted by entropy, entries are the index of the lowest entropy
  // location. The heap cannot be updated, so we must check the entropy array to see if the entropy
  // of a location is still non-zero
  entropyHeap: MinHeap<number> = new MinHeap<number>()

  visited: Map<number, boolean> = new Map()

  constructor(parser: PatternParser, width: number, height: number) {
    this.parser = parser;
    this.width = width;
    this.height = height;
    this.initializePossibilities();
    this.initializeEntropy();
  }

  initializePossibilities() {
    this.possibilities = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.possibilities.push(new Set<number>());
        for (let i = 0; i < this.parser.patterns.length; i++) {
          this.possibilities[y * this.width + x].add(i);
        }
      }
    }
  }

  initializeEntropy() {
    this.entropy = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const entropy = this.calculateEntropy(y * this.width + x);
        this.entropy.push(entropy);
        this.entropyHeap.insert(entropy, y * this.width + x);
      }
    }
  }

  step(): boolean {
    if (this.entropyHeap.empty()) return true;
    let minEntropy: number;
    do {
      minEntropy = this.entropyHeap.pop();
      if (this.entropyHeap.empty()) return true;
    } while (this.entropy[minEntropy] === 0 || this.possibilities[minEntropy].size < 2);
    const selection = this.lottery(this.possibilities[minEntropy]);
    this.startTrace();
    this.visited.clear();
    try {
      this.collapse(minEntropy, selection);
    } catch (e) {
      if (e instanceof Contradiction) {
        console.log('contradiction');
        const trace = this.traces.pop();
        if (!trace) {
          console.log("can't handle contradiction, no trace");
          throw e;
        }
        for (let traceLoc in trace) {
          for (let removed of trace[traceLoc].removed) {
            this.possibilities[traceLoc].add(removed);
          }
        }
        this.possibilities[minEntropy].delete(selection);
        if (this.possibilities[minEntropy].size === 0) {
          console.log("contradiction removed last possibility");
          throw e;
        }
        this.updateEntropy(minEntropy);
      } else {
        console.log("non-contradiction exception during collapse");
        throw e;
      }
    }
    return false;
  }

  collapse(loc: number, pattern: number) {
    this.visited.set(loc, true);
    const removed = this.possibilities[loc];
    removed.delete(pattern);
    this.trace(loc, new Set<number>(removed), pattern);
    this.possibilities[loc].clear();
    this.possibilities[loc].add(pattern);
    this.entropy[loc] = 0;
    for (let { loc: neighborLoc, dir: neighborDir } of this.eachNeighbor(loc)) {
      this.propagate(loc, neighborLoc, neighborDir);
    }
  }

  propagate(neighborLoc: number, loc: number, dir: Direction) {
    if (this.visited.get(loc)) return;
    this.visited.set(loc, true);
    if (this.possibilities[loc].size === 1) return;
    let neighborPossibilities = this.possibilities[neighborLoc];
    const removed = new Set<number>();
    for (let possiblePattern of this.possibilities[loc]) {
      let stillPossible = false;
      for (let possibleNeighborPattern of neighborPossibilities) {
        stillPossible = stillPossible || this.validConnection(possibleNeighborPattern, dir, possiblePattern);
      }
      if (!stillPossible) {
        this.possibilities[loc].delete(possiblePattern);
        removed.add(possiblePattern);
      }
    }
    if (removed.size === 0) return;
    this.trace(loc, removed);
    if (this.possibilities[loc].size === 1) {
      this.collapse(loc, this.possibilities[loc].values().next().value);
    } else {
      for (let { loc: neighborLoc, dir: neighborDir } of this.eachNeighbor(loc)) {
        this.propagate(loc, neighborLoc, neighborDir);
      }
    }
    if (this.updateEntropy(loc) === 0) throw new Contradiction('contradiction found during propagation');
  }

  updateEntropy(loc: number): number {
    const newEntropy = this.calculateEntropy(loc);
    this.entropy[loc] = newEntropy;
    if (newEntropy > 0) {
      this.entropyHeap.insert(newEntropy, loc);
    }
    return newEntropy;
  }

  *eachNeighbor(loc: number) {
    const [x, y] = [loc % this.width, Math.floor(loc / this.height)];
    for (let [direction, offset] of this.parser.neighbors.entries()) {
      const nx = x + offset.x;
      const ny = y + offset.y;
      if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
      yield { loc: ny * this.width + nx, dir: direction };
    }
  }

  calculateEntropy(loc: number): number {
    if (this.possibilities[loc].size === 1) {
      return 0;
    }
    let sum = 0;
    let sumOfLogs = 0;
    for (let patternIndex of this.possibilities[loc].values()) {
      sum += this.parser.weights[patternIndex];
      sumOfLogs += this.parser.weights[patternIndex] * Math.log(this.parser.weights[patternIndex]);
    }
    return Math.log(sum) - sumOfLogs / sum + 0.000001 * Math.random();
  }

  validConnection(fromPattern: number, dir: Direction, toPattern: number): boolean {
    return this.parser.adjacent.get(fromPattern)?.get(dir)?.get(toPattern) || false;
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
    for (let pattern of removed) {
      trace[loc].removed.add(pattern);
    }
  }

  lottery(possibilities: Set<number>): number {
    let sum = 0;
    for (let i of possibilities.values()) {
      sum += this.parser.weights[i];
    }
    const selected = Math.random() * sum;
    let total = 0;
    for (let i of possibilities.values()) {
      total += this.parser.weights[i];
      if (selected <= total) {
        return i;
      }
    }
    throw new Error('lottery failed');
  }

  tilemap(): Tilemap {
    const layers: TilemapLayer[] = this.parser.tilemap.layers.map(layer => JSON.parse(JSON.stringify(layer)));
    for (let i in layers) {
      const layer = layers[i];
      layer.width = this.width;
      layer.height = this.height;
      layer.data = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.possibilities[y * this.width + x].size === 1) {
            const patternIndex = this.possibilities[y * this.width + x].values().next().value;
            const pattern = this.parser.patterns[patternIndex];
            const tile = this.parser.tiles[pattern[0]];
            layer.data.push(parseInt(tile.split(',')[i]));
          } else {
            layer.data.push(0);
          }
        }
      }
    }
    return {
      compressionlevel: 0,
      height: this.height,
      width: this.width,
      orientation: this.parser.tilemap.orientation,
      renderorder: this.parser.tilemap.orientation,
      staggeraxis: this.parser.tilemap.staggeraxis,
      staggerindex: this.parser.tilemap.staggerindex,
      tiledversion: this.parser.tilemap.tiledversion,
      version: this.parser.tilemap.version,
      tileheight: this.parser.tilemap.tileheight,
      tilewidth: this.parser.tilemap.tilewidth,
      tilesets: this.parser.tilemap.tilesets,
      type: this.parser.tilemap.type,
      layers: layers,
    }
  }

}