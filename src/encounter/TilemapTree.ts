import { Tilemap } from '../Tiled';

export default class Node {
  x1: number
  y1: number
  x2: number
  y2: number

  tilemap?: Tilemap

  left?: Node
  right?: Node
  up?: Node
  down?: Node

  constructor(tilemap: Tilemap) {
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = tilemap.width;
    this.y2 = tilemap.height;
    this.tilemap = tilemap;
  }

  insert(x: number, y: number, tilemap: Tilemap) {
    this.tilemap = tilemap;
  }

  retrieve(x1: number, y1: number, x2: number, y2: number): Node[] {
    if (x1 >= this.x2 || this.x1 >= x2) return [];
    if (y1 >= this.y2 || this.y1 >= y2) return [];
    if (this.tilemap) return [this];
    return [];
  }
}