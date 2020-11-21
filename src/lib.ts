import * as martinez from 'martinez-polygon-clipping';

export function line(x0: number, y0: number, x1: number, y1: number): { x: number, y: number }[] {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;
  const points = [];
  while (true) {
    points.push({ x: x0, y: y0 });
    if ((x0 === x1) && (y0 === y1)) break;
    var e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return points;
}

export function sqDist(x0: number, y0: number, x1: number, y1: number): number {
  return (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
}

export function dist(a: number[], b: number[]): number {
  return Math.sqrt(sqDist(a[0], a[1], b[0], b[1]));
}

export function area(points: number[][]) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[i + 1];
    a += curr[0] * next[0] - curr[1] * next[1];
  }
  return Math.abs(a / 2);
}

export function rgbToHex(r: number, g: number, b: number): string {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) throw new Error('Invalid color component');
  return ((r << 16) | (g << 8) | b).toString(16);
}

export function colorToIndex(r: number, g: number, b: number): number {
  return ((r << 16) | (g << 8) | b);
}

export function indexToColor(i: number): string {
  if (i < 0 || i >= 256 * 256 * 256) throw new Error('Index out of range');
  return '#' + i.toString(16).padStart(6, '0');
}

export function boundingRect(from: number[], to: number[], closest: number = 1) {
  let x1 = Math.min(from[0], to[0]);
  let y1 = Math.max(from[1], to[1]);
  let x2 = Math.max(from[0], to[0]);
  let y2 = Math.min(from[1], to[1]);
  x1 = Math.round(x1 / closest) * closest;
  y1 = Math.round(y1 / closest) * closest;
  x2 = Math.round(x2 / closest) * closest;
  y2 = Math.round(y2 / closest) * closest;
  return [[x1, y1], [x2, y2]];
}

export function bbox(points: number[][]) {
  const minX = Math.min(...points.map(p => p[0]));
  const maxX = Math.max(...points.map(p => p[0]));
  const minY = Math.min(...points.map(p => p[1]));
  const maxY = Math.max(...points.map(p => p[1]));
  return {
    sw: [minX, maxY],
    ne: [maxX, minY],
    w: maxX - minX,
    h: maxY - minY,
  };
}

export function merge(features: GeoJSON.Feature[]) {
  while (true) {
    let overlap = false;
    for (let i = 0; i < features.length; i++) {
      for (let j = 0; j < features.length; j++) {
        if (i === j) continue;
        const f1 = features[i];
        const f2 = features[j];
        if (f1.geometry.type === 'Polygon' && f2.geometry.type === 'Polygon') {
          const union = martinez.union(f1.geometry.coordinates, f2.geometry.coordinates);
          if (union.length === 1) {
            f1.geometry.coordinates = union[0] as number[][][];
            features.splice(j, 1);
            overlap = true;
            break;
          }
        }
      }
    }
    if (!overlap) return;
  }
}