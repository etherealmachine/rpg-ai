import { Tilemap } from '../Tiled';
import TileHelper from './TileHelper';

type Pattern = number[]

export enum Direction {
  Left = 'Left',
  Right = 'Right',
  Up = 'Up',
  Down = 'Down',
}

export default class Parser {

  tilemap: Tilemap
  tileHelper: TileHelper
  tiles: string[] = []
  tileIndex: number[]
  patternSize: number
  patterns: Pattern[] = []
  patternIndex: number[]
  patternWeights: number[] = []
  adjacent: { [key: number]: { [key: string]: { [key: number]: boolean } } } = {}
  compatible: { [key: number]: { [key: string]: { [key: number]: boolean } } } = {}
  neighbors: { [key: string]: { x: number, y: number } } = {
    [Direction.Left]: { x: -1, y: 0 },
    [Direction.Right]: { x: 1, y: 0 },
    [Direction.Up]: { x: 0, y: -1 },
    [Direction.Down]: { x: 0, y: 1 },
  }

  constructor(tilemap: Tilemap, tileHelper: TileHelper, patternSize: number) {
    this.tilemap = tilemap;
    this.tileHelper = tileHelper;
    this.patternSize = patternSize;
    this.tileIndex = new Array(this.tilemap.width * this.tilemap.height);
    this.patternIndex = new Array(this.tilemap.width * this.tilemap.height);

    const tileset = new Set<string>();
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const tile = this.tileStringAt(x, y);
        if (tile) tileset.add(tile);
      }
    }
    this.tiles = new Array(...tileset);
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const tile = this.tileStringAt(x, y);
        if (tile === undefined) throw new Error(`undefined tile at ${x}, ${y}`);
        const tileIndex = this.tiles.indexOf(tile);
        if (tileIndex === -1) throw new Error(`can't find tile index for ${tile} at ${x}, ${y}`);
        this.tileIndex[y * this.tilemap.width + x] = tileIndex;
      }
    }
    for (let x = 0; x < this.tilemap.width; x++) {
      for (let y = 0; y < this.tilemap.height; y++) {
        const tileIndex = this.tileIndexAt(x, y);
        for (let [dir, delta] of Object.entries(this.neighbors)) {
          const [nx, ny] = [x + delta.x, y + delta.y];
          const neighborIndex = this.tileIndexAt(nx, ny);
          if (tileIndex !== undefined && neighborIndex !== undefined) {
            this.addAdjacency(tileIndex, dir as Direction, neighborIndex);
            this.addAdjacency(neighborIndex, this.inverse(dir as Direction), tileIndex);
          }
        }
      }
    }
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const pattern = [];
        for (let dy = 0; dy < patternSize; dy++) {
          for (let dx = 0; dx < patternSize; dx++) {
            const [nx, ny] = [x + dx, y + dy];
            const tile = this.tileStringAt(nx, ny);
            let tileIndex = 0;
            if (tile !== undefined) {
              tileIndex = this.tiles.indexOf(tile);
            }
            pattern.push(tileIndex);
          }
        }
        const patternString = pattern.join(',');
        let patternIndex = this.patterns.findIndex(p => p.join(',') === patternString);
        const mapIndex = this.index(x, y);
        if (patternIndex === -1) {
          this.patterns.push(pattern as Pattern);
          this.patternWeights.push(1);
          patternIndex = this.patterns.length - 1;
        } else {
          this.patternWeights[patternIndex]++;
        }
        this.patternIndex[mapIndex] = patternIndex;
      }
    }
    if (patternSize === 1) {
      for (let i = 0; i < this.patterns.length; i++) {
        for (let j = 0; j < this.patterns.length; j++) {
          for (let dir of Object.keys(this.neighbors)) {
            if (this.isAdjacent(this.patterns[i][0], dir as Direction, this.patterns[j][0])) {
              this.addCompatible(i, dir as Direction, j);
              this.addCompatible(j, this.inverse(dir as Direction), i);
            }
          }
        }
      }
    } else {
      for (let i = 0; i < this.patterns.length; i++) {
        for (let j = 0; j < this.patterns.length; j++) {
          for (let [dir, delta] of Object.entries(this.neighbors)) {
            if (this.canOverlap(i, j, delta.x, delta.y)) {
              this.addCompatible(j, dir as Direction, i);
              this.addCompatible(i, this.inverse(dir as Direction), j);
            }
          }
        }
      }
    }
  }

  index(x: number, y: number): number {
    return x + y * this.tilemap.width;
  }

  indexPattern(x: number, y: number): number {
    return x + y * this.patternSize;
  }

  inverse(d: Direction): Direction {
    switch (d) {
      case Direction.Left: return Direction.Right;
      case Direction.Right: return Direction.Left;
      case Direction.Up: return Direction.Down;
      case Direction.Down: return Direction.Up;
    }
  }

  tileAt(x: number, y: number): number[] | undefined {
    if (x < 0 || x >= this.tilemap.width || y < 0 || y >= this.tilemap.height) return undefined;
    return this.tilemap.layers.map(layer => {
      const data = layer.data;
      if (!data) return 0;
      return data[y * this.tilemap.width + x];
    });
  }

  tileStringAt(x: number, y: number): string | undefined {
    if (x < 0 || x >= this.tilemap.width || y < 0 || y >= this.tilemap.height) return undefined;
    return this.tilemap.layers.map(layer => {
      const data = layer.data;
      if (!data) return 0;
      return data[y * this.tilemap.width + x];
    }).join(',');
  }

  tileIndexAt(x: number, y: number): number | undefined {
    return this.tileIndex[y * this.tilemap.width + x];
  }

  addAdjacency(from: number, dir: Direction, to: number) {
    let fromMap = this.adjacent[from];
    if (!fromMap) {
      fromMap = {};
      this.adjacent[from] = fromMap;
    }
    let dirAdj = fromMap[dir];
    if (!dirAdj) {
      dirAdj = []
      fromMap[dir] = dirAdj;
    }
    dirAdj[to] = true;
  }

  isAdjacent(t1: number, dir: Direction, t2: number): boolean {
    return this.adjacent[t1][dir][t2] || false;
  }

  addCompatible(from: number, dir: Direction, to: number) {
    let fromMap = this.compatible[from];
    if (!fromMap) {
      fromMap = {};
      this.compatible[from] = fromMap;
    }
    let dirCompat = fromMap[dir];
    if (!dirCompat) {
      dirCompat = [];
      fromMap[dir] = dirCompat;
    }
    dirCompat[to] = true;
  }

  canOverlap(pattern1: number, pattern2: number, dx: number, dy: number): boolean {
    const p1 = this.patterns[pattern1];
    const p2 = this.patterns[pattern2];
    for (let x = 0; x < this.patternSize; x++) {
      for (let y = 0; y < this.patternSize; y++) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || nx >= this.patternSize || ny < 0 || ny >= this.patternSize) continue;
        const i = this.indexPattern(x, y);
        const j = this.indexPattern(nx, ny);
        if (p1[i] !== p2[j]) return false;
      }
    }
    return true;
  }

  drawCompatible(ctx: CanvasRenderingContext2D, loc: { x: number, y: number }) {
    const patternIndex = this.patternIndex[this.index(loc.x, loc.y)];
    if (patternIndex === undefined) return;
    const pattern = this.patterns[patternIndex];
    ctx.textBaseline = 'top';
    ctx.fillText(`${patternIndex}`, 32, 0);
    this.drawPattern(ctx, pattern);
    const compatibleByDir = this.compatible[patternIndex];
    if (compatibleByDir === undefined) return;
    for (let [dir, compatibilities] of Object.entries(compatibleByDir)) {
      ctx.translate(0, this.tilemap.tileheight * this.patternSize);
      ctx.fillText(`${dir}`, 64, 0);
      for (let compatible of Object.keys(compatibilities)) {
        const neighborPattern = this.patterns[parseInt(compatible)];
        ctx.translate(0, this.tilemap.tileheight * this.patternSize);
        ctx.textBaseline = 'top';
        ctx.fillText(`${compatible}`, 32, 0);
        this.drawPattern(ctx, neighborPattern);
      }
    }
  }

  drawPattern(ctx: CanvasRenderingContext2D, pattern: number[]) {
    for (let x = 0; x < this.patternSize; x++) {
      for (let y = 0; y < this.patternSize; y++) {
        const tileIndex = pattern[this.indexPattern(x, y)];
        for (let tile of this.tiles[tileIndex].split(',').map(x => parseInt(x))) {
          this.tileHelper.drawTile(ctx, x, y, tile);
        }
      }
    }
  }

}