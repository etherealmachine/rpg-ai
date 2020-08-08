export default class WaveFunctionCollapse {

  // number of dimensions
  num_dims: number

  // rules is an array of 3-tuples
  // each rule contains the axis and two tiles that can be neighbors along that axis
  rules: number[][]

  // weights is the frequency of each tile
  weights: number[]

  wave: { [key: string]: number } = {}

  wavefront: { [key: string]: number[] } = {}

  constructor(num_dims: number, rules: number[][], weights: number[]) {
    this.num_dims = num_dims;
    this.weights = weights;
    this.rules = rules;
  }

  coord(k: string): number[] {
    return k.split(",").map(x => parseInt(x));
  }

  key(coord: number[]): string {
    return coord.join(',');
  }

  // calculate the shannon entropy of a given set of possible tiles
  entropy(x: number[]) {
    let one = 0;
    for (let i = 0; i < x.length; i++) {
      one += x[i] * this.weights[i];
    }
    let S = 0;
    for (let i = 0; i < x.length; i++) {
      let pi = x[i] * this.weights[i] / one;
      if (pi != 0) {
        S -= pi * Math.log(pi);
      }
    }
    return S;
  }

  // collapse the possible tiles into a single tile
  collapse(x: number[]): number[] {
    let one = 0;
    for (let i = 0; i < x.length; i++) {
      one += x[i] * this.weights[i];
    }
    let r = Math.random() * one;
    for (let i = 0; i < x.length; i++) {
      r -= x[i] * this.weights[i];
      if (r < 0) {
        let y = new Array(x.length).fill(0);
        y[i] = 1;
        return y;
      }
    }
    throw new Error('failed to collapse');
  }

  neighborable(d: number[], a: number, b: number) {
    let didx = d.indexOf(1);
    if (didx < 0) {
      didx = d.indexOf(-1);
      [a, b] = [b, a];
    }
    for (let i = 0; i < this.rules.length; i++) {
      if (didx == this.rules[i][0]) {
        if (a == this.rules[i][1] && b == this.rules[i][2]) {
          return true;
        }
      }
    }
    return false;
  }

  propagate(p: number[]) {
    let stack = [p];

    while (stack.length) {
      p = (stack.pop() as number[]);

      let dirs = [];
      for (let i = 0; i < this.num_dims; i++) {
        let d0 = new Array(this.num_dims).fill(0);
        d0[i] = -1;
        dirs.push(d0);

        let d1 = new Array(this.num_dims).fill(0);
        d1[i] = 1;
        dirs.push(d1);
      }
      for (let i = 0; i < dirs.length; i++) {
        let q: number[] = [];
        for (let j = 0; j < p.length; j++) {
          q.push(p[j] + dirs[i][j]);
        }
        let x: number[] | number = this.wavefront[this.key(p)];
        if (x == undefined) x = this.wave[this.key(p)];
        let y: number[] | number = this.wavefront[this.key(q)];
        if (x == undefined) x = this.wave[this.key(q)];

        if (typeof y == 'number' || typeof y == 'undefined') {
          continue;
        } else if (typeof x == 'number' && typeof y == 'object') {
          let mod = false;
          for (let j = 0; j < y.length; j++) {
            if (y[j] == 0) {
              continue;
            }
            if (y[j] > 0 && !this.neighborable(dirs[i], x, j)) {
              y[j] = 0;
              mod = true;
            }
          }
          if (mod) {
            stack.push(q);
          }
        } else if (typeof x == 'object' && typeof y == 'object') {
          let mod = false;
          for (let j = 0; j < y.length; j++) {
            if (y[j] == 0) {
              continue;
            }
            let ok = false;
            for (let k = 0; k < x.length; k++) {
              if (x[k] > 0 && y[j] > 0 && this.neighborable(dirs[i], k, j)) {
                ok = true;
                break;
              }
            }
            if (!ok) {
              y[j] = 0;
              mod = true;
            }
          }
          if (mod) {
            stack.push(q);
          }
        }
      }
    }
  }

  argmax(vals: number[]): number {
    let mi = -1;
    let mv = -Infinity;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] > mv) {
        mv = vals[i];
        mi = i;
      }
    }
    return mi;
  }

  readout(collapse = true) {
    if (!collapse) {
      let result: { [key: string]: number[] } = {};
      for (let k in this.wave) {
        let oh = Array(this.weights.length).fill(0);
        oh[this.wave[k]] = 1;
        result[k] = oh;
      }
      for (let k in this.wavefront) {
        let s = this.wavefront[k].reduce((a, b) => a + b, 0)
        let oh = this.wavefront[k].map(x => (s == 0 ? 0 : x / s));
        result[k] = oh;
      }
      return result;
    }

    let result: { [key: string]: number } = {}
    for (let k in this.wavefront) {
      if (this.wavefront[k].reduce((a, b) => a + b, 0) == 1) {
        result[k] = this.argmax(this.wavefront[k]);
      }
    }
    return Object.assign({}, this.wave, result);
  }

  expand(xmin: number[], xmax: number[]) {
    let coords: number[][] = [[0]];
    for (let i = 0; i < xmin.length; i++) {
      let cc: number[][] = [];
      for (let x = xmin[i]; x < xmax[i]; x++) {
        let c: number[][] = [];
        for (let j = 0; j < coords.length; j++) {
          c.push(coords[j].concat(x));
        }
        cc = cc.concat(c);
      }
      coords = cc;
    }
    coords = coords.map(x => x.slice(1)).filter(x => !(this.key(x) in this.wave || this.key(x) in this.wavefront));

    coords.map(x => this.wavefront[this.key(x)] = new Array(this.weights.length).fill(1));
    for (let k in this.wave) {
      this.propagate(this.coord(k));
    }
  }

  step() {
    let min_ent: number = Infinity;
    let min_arg: number[] | undefined = undefined;

    for (let k in this.wavefront) {
      let ent = this.entropy(this.wavefront[k]);
      if (isNaN(ent)) {
        for (let k in this.wavefront) {
          this.wavefront[k] = new Array(this.weights.length).fill(1);
        }
        for (let k in this.wave) {
          this.propagate(this.coord(k));
        }
        console.log(":(");
        return false;
      }
      if (ent == 0) {
        continue;
      }
      ent += (Math.random() - 0.5);
      if (ent < min_ent) {
        min_ent = ent;
        min_arg = this.coord(k);
      }
    }

    if (min_ent == Infinity || min_arg === undefined) {
      this.wave = this.readout() as { [key: string]: number };
      this.wavefront = {};
      return true;
    }
    const k = this.key(min_arg);
    this.wavefront[k] = this.collapse(this.wavefront[k]);
    this.propagate(min_arg);
    return false;
  }
}