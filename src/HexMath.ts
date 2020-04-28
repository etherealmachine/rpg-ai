import Phaser from 'phaser';

export class Hex {
  static directions = [new Hex(1, 0, -1), new Hex(1, -1, 0), new Hex(0, -1, 1), new Hex(-1, 0, 1), new Hex(-1, 1, 0), new Hex(0, 1, -1)]
  static diagonals = [new Hex(2, -1, -1), new Hex(1, -2, 1), new Hex(-1, -1, 2), new Hex(-2, 1, 1), new Hex(-1, 2, -1), new Hex(1, 1, -2)]

  q: number
  r: number
  s: number

  constructor(q: number, r: number, s: number) {
    this.q = q;
    this.r = r;
    this.s = s;
    if (Math.round(q + r + s) !== 0) throw new Error("q + r + s must be 0");
  }

  toString() {
    return `${this.q},${this.r},${this.s}`;
  }

  static fromString(str: string) {
    const [q, r, s] = str.split(',');
    return new Hex(parseInt(q), parseInt(r), parseInt(s));
  }

  add(b: Hex) {
    return new Hex(this.q + b.q, this.r + b.r, this.s + b.s);
  }

  subtract(b: Hex) {
    return new Hex(this.q - b.q, this.r - b.r, this.s - b.s);
  }

  scale(k: number) {
    return new Hex(this.q * k, this.r * k, this.s * k);
  }

  rotateLeft() {
    return new Hex(-this.s, -this.q, -this.r);
  }

  rotateRight() {
    return new Hex(-this.r, -this.s, -this.q);
  }

  static direction(direction: number) {
    return Hex.directions[direction];
  }

  neighbor(direction: number) {
    return this.add(Hex.direction(direction));
  }

  diagonalNeighbor(direction: number) {
    return this.add(Hex.diagonals[direction]);
  }

  len() {
    return (Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2;
  }

  distance(b: Hex) {
    return this.subtract(b).len();
  }

  round() {
    var qi = Math.round(this.q);
    var ri = Math.round(this.r);
    var si = Math.round(this.s);
    var q_diff = Math.abs(qi - this.q);
    var r_diff = Math.abs(ri - this.r);
    var s_diff = Math.abs(si - this.s);
    if (q_diff > r_diff && q_diff > s_diff) {
      qi = -ri - si;
    }
    else if (r_diff > s_diff) {
      ri = -qi - si;
    }
    else {
      si = -qi - ri;
    }
    return new Hex(qi, ri, si);
  }

  lerp(b: Hex, t: number) {
    return new Hex(this.q * (1.0 - t) + b.q * t, this.r * (1.0 - t) + b.r * t, this.s * (1.0 - t) + b.s * t);
  }

  linedraw(b: Hex) {
    var N = this.distance(b);
    var a_nudge = new Hex(this.q + 1e-06, this.r + 1e-06, this.s - 2e-06);
    var b_nudge = new Hex(b.q + 1e-06, b.r + 1e-06, b.s - 2e-06);
    var results = [];
    var step = 1.0 / Math.max(N, 1);
    for (var i = 0; i <= N; i++) {
      results.push(a_nudge.lerp(b_nudge, step * i).round());
    }
    return results;
  }

  ring(radius: number) {
    var results = [];
    var H = Hex.direction(4).scale(radius);
    for (var side = 0; side < 6; side++) {
      for (var step = 0; step < radius; step++) {
        results.push(H);
        H = H.neighbor(side);
      }
    }
    return results;
  }
}

export class OffsetCoord {

  static EVEN = 1;
  static ODD = -1;

  col: number
  row: number

  constructor(col: number, row: number) {
    this.col = col;
    this.row = row;
  }

  static qoffsetFromCube(offset: number, h: Hex) {
    var col = h.q;
    var row = h.r + (h.q + offset * (h.q & 1)) / 2;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw new Error("offset must be EVEN (+1) or ODD (-1)");
    }
    return new OffsetCoord(col, row);
  }

  static qoffsetToCube(offset: number, h: OffsetCoord) {
    var q = h.col;
    var r = h.row - (h.col + offset * (h.col & 1)) / 2;
    var s = -q - r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw new Error("offset must be EVEN (+1) or ODD (-1)");
    }
    return new Hex(q, r, s);
  }

  static roffsetFromCube(offset: number, h: Hex) {
    var col = h.q + (h.r + offset * (h.r & 1)) / 2;
    var row = h.r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw new Error("offset must be EVEN (+1) or ODD (-1)");
    }
    return new OffsetCoord(col, row);
  }

  static roffsetToCube(offset: number, h: OffsetCoord) {
    var q = h.col - (h.row + offset * (h.row & 1)) / 2;
    var r = h.row;
    var s = -q - r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw new Error("offset must be EVEN (+1) or ODD (-1)");
    }
    return new Hex(q, r, s);
  }
}

export class DoubledCoord {

  col: number
  row: number

  constructor(col: number, row: number) {
    this.col = col;
    this.row = row;
  }

  static qdoubledFromCube(h: Hex) {
    var col = h.q;
    var row = 2 * h.r + h.q;
    return new DoubledCoord(col, row);
  }

  qdoubledToCube() {
    var q = this.col;
    var r = (this.row - this.col) / 2;
    var s = -q - r;
    return new Hex(q, r, s);
  }

  static rdoubledFromCube(h: Hex) {
    var col = 2 * h.q + h.r;
    var row = h.r;
    return new DoubledCoord(col, row);
  }

  rdoubledToCube() {
    var q = (this.col - this.row) / 2;
    var r = this.row;
    var s = -q - r;
    return new Hex(q, r, s);
  }
}

export class Orientation {

  f0: number
  f1: number
  f2: number
  f3: number
  b0: number
  b1: number
  b2: number
  b3: number
  start_angle: number

  constructor(f0: number, f1: number, f2: number, f3: number, b0: number, b1: number, b2: number, b3: number, start_angle: number) {
    this.f0 = f0;
    this.f1 = f1;
    this.f2 = f2;
    this.f3 = f3;
    this.b0 = b0;
    this.b1 = b1;
    this.b2 = b2;
    this.b3 = b3;
    this.start_angle = start_angle;
  }
}

export class Layout {

  static pointy = new Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5);
  static flat = new Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);

  orientation: Orientation
  size: Phaser.Math.Vector2
  origin: Phaser.Math.Vector2

  constructor(orientation: Orientation, size: Phaser.Math.Vector2, origin: Phaser.Math.Vector2) {
    this.orientation = orientation;
    this.size = size;
    this.origin = origin;
  }

  hexToPixel(h: Hex) {
    var M = this.orientation;
    var size = this.size;
    var origin = this.origin;
    var x = (M.f0 * h.q + M.f1 * h.r) * size.x;
    var y = (M.f2 * h.q + M.f3 * h.r) * size.y;
    return new Phaser.Math.Vector2(x + origin.x, y + origin.y);
  }

  pixelToHex(p: Phaser.Math.Vector2) {
    var M = this.orientation;
    var size = this.size;
    var origin = this.origin;
    var pt = new Phaser.Math.Vector2((p.x - origin.x) / size.x, (p.y - origin.y) / size.y);
    var q = M.b0 * pt.x + M.b1 * pt.y;
    var r = M.b2 * pt.x + M.b3 * pt.y;
    return new Hex(q, r, -q - r);
  }

  hexCornerOffset(corner: number) {
    var M = this.orientation;
    var size = this.size;
    var angle = 2.0 * Math.PI * (M.start_angle - corner) / 6.0;
    return new Phaser.Math.Vector2(size.x * Math.cos(angle), size.y * Math.sin(angle));
  }

  polygonCorners(h: Hex) {
    var corners = [];
    var center = this.hexToPixel(h);
    for (var i = 0; i < 6; i++) {
      var offset = this.hexCornerOffset(i);
      corners.push(new Phaser.Math.Vector2(center.x + offset.x, center.y + offset.y));
    }
    return corners;
  }
}