import * as martinez from 'martinez-polygon-clipping';
import { Feature } from './State';

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

export function sqDist(a: number[], b: number[]): number {
  return (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]);
}

export function dist(a: number[], b: number[]): number {
  return Math.sqrt(sqDist(a, b));
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

export function lerp(d: number, from: number, to: number): number {
  return from + (to - from) * d;
}

export function lerp2(d: number, from: number[], to: number[]): number[] {
  return [lerp(d, from[0], to[0]), lerp(d, from[1], to[1])];
}

export function clamp(p: number, min: number, max: number): number {
  if (p < min) return min;
  if (p > max) return max;
  return p;
}

export function rgbToHex(r: number, g: number, b: number): string {
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) throw new Error('Invalid color component');
  return ((r << 16) | (g << 8) | b).toString(16);
}

export function colorToIndex(r: number, g: number, b: number): number[] {
  return [r, g];
}

export function indexToColor(i: number, j: number): string {
  if (i < 0 || i >= 256) throw new Error('Index out of range');
  if (j < 0 || j >= 256) throw new Error('Index out of range');
  return `rgb(${i}, ${j}, 0)`;
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

export function closestPointToLine(p: number[], a: number[], b: number[]): { point: number[], distance: number } {
  const ap = [p[0] - a[0], p[1] - a[1]]; // Line segment AP
  const ab = [b[0] - a[0], b[1] - a[1]]; // Line segment AB
  const ab2 = ab[0] * ab[0] + ab[1] * ab[1]; // Square magnitude of AB, ||AB||^2
  const ap_dot_ab = ap[0] * ab[0] + ap[1] * ab[1] // Dot product, AP∙AB
  const d = clamp(ap_dot_ab / ab2, 0, 1); // Normalized distance from A to closest point
  const point = [a[0] + ab[0] * d, a[1] + ab[1] * d];
  return {
    point: point,
    distance: dist(point, p),
  };
}

interface ClosestPoint {
  point: number[]
  line: number[]
  distance: number
}

interface ClosestFeature {
  feature: number
  geometry: number
  closestPoint: ClosestPoint
}

export interface DoorPlacement extends ClosestFeature {
  from: number[]
  to: number[]
}

export function closestPointToPolygon(point: number[], polygon: number[][]): ClosestPoint {
  return polygon.map((a: number[], i: number) => {
    return {
      ...closestPointToLine(point, a, polygon[(i + 1) % polygon.length]),
      line: [i, (i + 1) % polygon.length],
    };
  }).sort((a, b) => a.distance - b.distance)[0];
}

export function detectDoorPlacement(point: number[], features: Feature[], fullWidth: boolean): DoorPlacement | undefined {
  const closestFeature = features.flatMap((feature, i) => {
    return feature.geometries.flatMap((geometry, j) => {
      if (geometry.type === 'polygon') {
        return {
          feature: i,
          geometry: j,
          closestPoint: closestPointToPolygon(point, geometry.coordinates),
        };
      } else if (geometry.type === 'line') {
        return {
          feature: i,
          geometry: j,
          closestPoint: {
            ...closestPointToLine(point, geometry.coordinates[0], geometry.coordinates[1]),
            line: [0, 1],
          },
        };
      }
      return undefined;
    });
  }).sort((a, b) => {
    if (a === undefined || b === undefined) return Infinity;
    return a.closestPoint.distance - b.closestPoint.distance;
  })[0];
  if (!closestFeature) return undefined;
  return computeDoorPlacement(closestFeature, features, fullWidth);
}

function computeDoorPlacement(f: ClosestFeature, features: Feature[], fullWidth: boolean): DoorPlacement | undefined {
  const geom = features[f.feature].geometries[f.geometry];
  if (!['polygon', 'line'].includes(geom.type)) return undefined;
  const coords = geom.coordinates;
  const from = coords[f.closestPoint.line[0]];
  const to = coords[f.closestPoint.line[1]];

  if (fullWidth) {
    return { ...f, from: [...from], to: [...to] };
  }

  const center = f.closestPoint.point;
  const slope = (to[1] - from[1]) / (to[0] - from[0]);

  const vdy1 = (Math.floor(center[1]) - from[1]);
  const vdx1 = vdy1 / slope;
  const vdy2 = (Math.ceil(center[1]) - from[1]);
  const vdx2 = vdy2 / slope;

  const hdx1 = (Math.floor(center[0]) - from[0]);
  const hdy1 = hdx1 * slope;
  const hdx2 = (Math.ceil(center[0]) - from[0]);
  const hdy2 = hdx2 * slope;

  const vfrom = [from[0] + vdx1, from[1] + vdy1];
  const vto = [from[0] + vdx2, from[1] + vdy2];
  const vdist = dist(vfrom, vto);

  const hfrom = [from[0] + hdx1, from[1] + hdy1];
  const hto = [from[0] + hdx2, from[1] + hdy2];
  const hdist = dist(hfrom, hto);

  if ((isNaN(hdist) || vdist <= hdist) && vdist > 0) {
    return {
      ...f,
      from: vfrom,
      to: vto,
    };
  } else if ((isNaN(vdist) || hdist < vdist) && hdist > 0) {
    return {
      ...f,
      from: hfrom,
      to: hto,
    };
  }
  return undefined;
}