import { Tilemap } from '../Tiled';

import Parser, { Direction } from './Parser';

const Directions = [
  Direction.Up,
  Direction.Down,
  Direction.Left,
  Direction.Right,
];

const Opposite = [1, 0, 3, 2];

export class Generator {

  parser: Parser
  targetWidth: number
  targetHeight: number
  assignments: (number | undefined)[]

  wave: boolean[][]
  compatible: number[][][]
  weightLogWeights: number[]
  sumOfWeights = 0
  sumOfWeightLogWeights = 0

  startingEntropy = 0

  sumsOfOnes: number[]
  sumsOfWeights: number[]
  sumsOfWeightLogWeights: number[]
  entropies: number[]

  propagator: number[][][]

  stack: number[][] = []

  constructor(parser: Parser, targetWidth: number, targetHeight: number) {
    this.parser = parser;
    this.targetWidth = targetWidth;
    this.targetHeight = targetHeight;
    this.assignments = new Array(targetWidth * targetHeight);

    this.propagator = new Array(4);

    for (let d = 0; d < 4; d++) {
      this.propagator[d] = new Array(this.parser.patterns.length);
      const dir = Directions[d];
      for (let t = 0; t < this.parser.patterns.length; t++) {
        const list = [];
        for (let t2 = 0; t2 < this.parser.patterns.length; t2++) {
          if (this.parser.compatible[t] && this.parser.compatible[t][dir] && this.parser.compatible[t][dir][t2]) {
            list.push(t2);
          }
        }
        this.propagator[d][t] = list;
      }
    }

    this.wave = new Array(this.targetWidth * this.targetHeight);
    this.compatible = new Array(this.targetWidth * this.targetHeight);

    for (let i = 0; i < this.wave.length; i++) {
      this.wave[i] = new Array(this.parser.patterns.length);
      this.compatible[i] = new Array(this.parser.patterns.length);

      for (let t = 0; t < this.parser.patterns.length; t++) {
        this.wave[i][t] = true;
        this.compatible[i][t] = [0, 1, 2, 3].map(dir => this.propagator[Opposite[dir]][t].length);
      }
    }

    this.weightLogWeights = new Array(this.parser.patterns.length);
    this.sumOfWeights = 0;
    this.sumOfWeightLogWeights = 0;

    for (let t = 0; t < this.parser.patterns.length; t++) {
      this.weightLogWeights[t] = this.parser.patternWeights[t] * Math.log(this.parser.patternWeights[t]);
      this.sumOfWeights += this.parser.patternWeights[t];
      this.sumOfWeightLogWeights += this.weightLogWeights[t];
    }

    this.startingEntropy = Math.log(this.sumOfWeights) - this.sumOfWeightLogWeights / this.sumOfWeights;

    this.sumsOfOnes = new Array(this.targetWidth * this.targetHeight);
    this.sumsOfWeights = new Array(this.targetWidth * this.targetHeight);
    this.sumsOfWeightLogWeights = new Array(this.targetWidth * this.targetHeight);
    this.entropies = new Array(this.targetWidth * this.targetHeight);

    for (let i = 0; i < this.entropies.length; i++) {
      this.sumsOfOnes[i] = this.parser.patternWeights.length;
      this.sumsOfWeights[i] = this.sumOfWeights;
      this.sumsOfWeightLogWeights[i] = this.sumOfWeightLogWeights;
      this.entropies[i] = this.startingEntropy;
    }
  }

  step() {
    try {
      const result = this.observe();
      if (result) {
        return result;
      }
      this.propagate();
      return false;
    } catch (e) {
      try {
      } catch {
        return undefined;
      }
    }
  }

  observe() {
    let min = 1000;
    let argmin = -1;

    for (let i = 0; i < this.entropies.length; i++) {
      const amount = this.sumsOfOnes[i];
      if (amount === 0) throw new Error("amount is zero");
      const entropy = this.entropies[i];
      if (amount > 1 && entropy <= min) {
        const noise = 0.000001 * Math.random();
        if (entropy + noise < min) {
          min = entropy + noise;
          argmin = i;
        }
      }
    }

    if (argmin === -1) {
      return true;
    }

    const r = this.lottery(this.wave[argmin]);

    const w = this.wave[argmin];
    for (let t = 0; t < w.length; t++) {
      if (w[t] && t !== r) this.ban(argmin, t);
    }

    return false;
  }

  propagate() {
    while (this.stack.length > 0) {
      const e1 = this.stack.pop();
      if (e1 === undefined) return;

      const i1 = e1[0];
      const x1 = i1 % this.targetWidth;
      const y1 = i1 / this.targetWidth | 0;

      for (let d = 0; d < 4; d++) {
        const delta = this.parser.neighbors[Directions[d]];
        if (delta === undefined) throw new Error(`no direction found for ${d}`);
        const dx = delta.x;
        const dy = delta.y;

        let x2 = x1 + dx;
        let y2 = y1 + dy;

        if (x2 < 0 || x2 >= this.targetWidth || y2 < 0 || y2 >= this.targetHeight) continue;

        const i2 = x2 + y2 * this.targetWidth;
        const p = this.propagator[d][e1[1]];
        const compat = this.compatible[i2];

        for (let l = 0; l < p.length; l++) {
          const t2 = p[l];
          const comp = compat[t2];
          comp[d]--;
          if (comp[d] === 0) this.ban(i2, t2);
        }
      }
    }
  }

  ban(i: number, t: number) {
    const comp = this.compatible[i][t];
    for (let d = 0; d < 4; d++) {
      comp[d] = 0;
    }

    this.wave[i][t] = false;

    this.sumsOfOnes[i] -= 1;
    this.sumsOfWeights[i] -= this.parser.patternWeights[t];
    this.sumsOfWeightLogWeights[i] -= this.weightLogWeights[t];

    const sum = this.sumsOfWeights[i];
    this.entropies[i] = Math.log(sum) - this.sumsOfWeightLogWeights[i] / sum;

    if (this.sumsOfOnes[i] === 0) throw new Error('contradiction');

    this.stack.push([i, t]);
  }

  lottery(possibilities: boolean[]): number {
    const tickets = new Array(possibilities.length);
    let totalTickets = 0;
    for (let i = 0; i < tickets.length; i++) {
      tickets[i] = possibilities[i] ? this.parser.patternWeights[i] : 0;
      totalTickets += possibilities[i] ? this.parser.patternWeights[i] : 0;
    }
    let winner = Math.floor(Math.random() * totalTickets);
    for (let i = 0; i < tickets.length; i++) {
      if (!possibilities[i]) continue;
      winner -= this.parser.patternWeights[i];
      if (winner <= 0) return i;
    }
    throw new Error('lottery failed');
  }

  drawEntropy(ctx: CanvasRenderingContext2D) {
    const maxEntropy = Math.max(...this.entropies);
    const minEntropy = Math.min(...this.entropies);
    for (let x = 0; x < this.targetWidth; x++) {
      for (let y = 0; y < this.targetHeight; y++) {
        const i = y * this.targetWidth + x;
        if (this.wave[i].reduce((sum, b) => b ? sum + 1 : sum, 0) === 1) {
          const tiles = this.parser.tiles[this.parser.patterns[this.wave[i].findIndex(b => b)][0]].split(',').map(x => parseInt(x));
          for (let tile of tiles) {
            this.parser.tileHelper.drawTile(ctx, x, y, tile);
          }
        } else {
          const entropy = this.entropies[i];
          const e = 255 * ((maxEntropy - entropy) / (maxEntropy - minEntropy));
          ctx.fillStyle = `rgba(${e}, ${e}, ${e}, 1)`;
          ctx.fillRect(x * this.parser.tilemap.tilewidth, y * this.parser.tilemap.tileheight, this.parser.tilemap.tilewidth, this.parser.tilemap.tileheight);
        }
      }
    }
  }

  generated(): Tilemap {
    const generated = JSON.parse(JSON.stringify(this.parser.tilemap)) as Tilemap;
    generated.width = this.targetWidth;
    generated.height = this.targetHeight;
    for (let i in generated.layers) {
      const layer = generated.layers[i];
      layer.width = this.targetWidth;
      layer.height = this.targetHeight;
      layer.data = new Array(this.targetWidth * this.targetHeight);
    }
    for (let x = 0; x < generated.width; x++) {
      for (let y = 0; y < generated.height; y++) {
        const patternIndex = this.wave[y * generated.width + x].findIndex(p => p);
        const pattern = this.parser.patterns[patternIndex];
        const tileIndex = pattern[0];
        const tile = this.parser.tiles[tileIndex];
        const tiles = tile.split(',').map(x => parseInt(x));
        for (let i in tiles) {
          const data = generated.layers[i].data;
          if (data) {
            data[y * generated.width + x] = tiles[i];
          }
        }
      }
    }
    return generated;
  }

}

const ctx: Worker = self as any; // eslint-disable-line no-restricted-globals
ctx.addEventListener('message', event => {
  const generator = new Generator(event.data.parser, event.data.targetWidth, event.data.targetHeight);
  let done = generator.step();
  let i = 0;
  while (done === false) {
    done = generator.step();
    ctx.postMessage({
      iteration: i,
      entropy: generator.entropies,
    });
    i++;
  }
  if (done) {
    ctx.postMessage({
      generated: generator.generated(),
    });
  } else {
    ctx.postMessage({
      error: 'contradiction',
    });
  }
});