import React, { useContext, useEffect, useRef } from 'react';

import {
  bbox,
  colorToIndex,
  detectDoorPlacement,
  detectStairsPlacement,
  dist,
  indexToColor,
  lerp2,
} from './lib';
import { Context, Geometry, Level, State } from './State';

const shadowColor = '#999';
const backgroundColor = '#D9D2BF';
const floorColor = '#F1ECE0';
const wallColor = '#000';
const selectionFillColor = '#2f557466';
const selectionStrokeColor = '#2f5574';
const dragFillColor = '#2f557466';
const dragStrokeColor = '#2f5574';
const hoverFillColor = '#668dad66';
const hoverStrokeColor = '#668dad';
const pointColor = '#fff238';
const specialColors = [
  selectionFillColor, selectionStrokeColor,
  dragFillColor, dragStrokeColor,
  hoverFillColor, hoverStrokeColor,
];

class CanvasRenderer {
  mouse?: number[] = undefined
  mouseDown: boolean = false
  drag?: {
    start: number[]
    end: number[]
  }
  points: number[][] = []
  polygonToolSelected: boolean = false
  hover?: {
    featureIndex: number | undefined
    geometryIndex: number | undefined
  }
  size: number = 30
  lastTime: number = 0
  requestID?: number
  appState = new State()
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  bufferCanvas: HTMLCanvasElement;
  bufferCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx === null) {
      throw new Error('canvas has null rendering context');
    }
    this.canvas = canvas;
    this.ctx = ctx;
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('wheel', this.onWheel);
    this.requestID = requestAnimationFrame(this.render);

    this.bufferCanvas = document.createElement('canvas');
    this.bufferCanvas.width = this.canvas.width;
    this.bufferCanvas.height = this.canvas.height;
    const bufferCtx = this.bufferCanvas.getContext('2d', { alpha: true });
    if (bufferCtx === null) {
      throw new Error('canvas has null rendering context');
    }
    this.bufferCtx = bufferCtx;
  }

  onMouseDown = (e: MouseEvent) => {
    this.mouseDown = true;
    const { mouse } = this;
    if (mouse) {
      this.drag = {
        start: this.canvasToTile(mouse),
        end: this.canvasToTile(mouse),
      };
    }
    if (this.appState.tools.pointer.selected) {
      const selectedFeatureIndex = this.appState.selection.featureIndex;
      const hoverFeatureIndex = this.hover?.featureIndex;
      const hoverGeometryIndex = this.hover?.geometryIndex;
      if (e.shiftKey && selectedFeatureIndex !== undefined && hoverFeatureIndex !== undefined && hoverGeometryIndex !== undefined) {
        if (selectedFeatureIndex === hoverFeatureIndex) {
          this.appState.ungroup(selectedFeatureIndex, hoverGeometryIndex);
        } else {
          this.appState.group(selectedFeatureIndex, hoverFeatureIndex);
        }
      } else {
        this.appState.setSelection({
          levelIndex: this.appState.selection.levelIndex,
          featureIndex: this.hover?.featureIndex,
          geometryIndex: this.hover?.geometryIndex,
        });
      }
    } else if (this.appState.tools.doors.selected && mouse) {
      const door = detectDoorPlacement(
        this.worldToTile(this.canvasToWorld(mouse), false),
        this.appState.levels[this.appState.selection.levelIndex].features);
      if (door) this.appState.addDoor(door);
    }
  }

  onMouseUp = () => {
    this.mouseDown = false;
    if (this.mouse && this.appState.tools.polygon.selected) {
      const pos = this.canvasToTile(this.mouse);
      if (this.points.length >= 1 && dist(this.points[0], pos) < 1) {
        this.appState.handlePolygon(this.points);
        this.points = [];
      } else {
        this.points.push(pos);
      }
    } else if (this.appState.tools.brush.selected) {
      this.appState.handleBrush(this.points);
      this.points = [];
      this.drag = undefined;
    } else if (this.drag) {
      let [from, to] = [this.drag.start, this.drag.end];
      if (
        this.appState.tools.rect.selected ||
        this.appState.tools.ellipse.selected) {
        const bounds = bbox([from, to]);
        from = bounds.sw;
        to = bounds.ne;
      }
      this.appState.handleDrag(from, to);
      this.drag = undefined;
      this.points = [];
    }
  }

  onMouseMove = (event: MouseEvent) => {
    this.mouse = [event.offsetX, event.offsetY];
    if (this.mouse && this.mouseDown && this.drag) {
      this.drag.end = this.canvasToTile(this.mouse);
      if (this.appState.tools.brush.selected) {
        this.points.push(this.worldToTile(this.canvasToWorld(this.mouse), false));
      }
    }
  }

  onWheel = (event: WheelEvent) => {
    const { mouse } = this;
    const { scale, offset } = this.appState;
    if (!mouse) return;
    const max = 4;
    const min = 0.2;
    const newScale = Math.max(Math.min(scale - event.deltaY / 100, max), min);
    const mouseWorldPos = this.canvasToWorld(mouse);
    const newMouseWorldPos = [mouse[0] / newScale - offset[0], mouse[1] / newScale - offset[1]];
    const newOffset = [
      offset[0] - (mouseWorldPos[0] - newMouseWorldPos[0]),
      offset[1] - (mouseWorldPos[1] - newMouseWorldPos[1])
    ];
    this.appState.setZoom(newScale, newOffset);
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (document.activeElement !== document.body) return;
    const { appState } = this;
    const S = this.size * this.appState.scale;
    let newOffset = appState.offset;
    if (event.key === 'w') newOffset = [appState.offset[0], appState.offset[1] + S];
    if (event.key === 'a') newOffset = [appState.offset[0] + S, appState.offset[1]];
    if (event.key === 's') newOffset = [appState.offset[0], appState.offset[1] - S];
    if (event.key === 'd') newOffset = [appState.offset[0] - S, appState.offset[1]];
    if (newOffset !== appState.offset) {
      appState.setOffset(newOffset);
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      appState.handleDelete();
    }
  }

  // canvas coordinates to world coordinates
  canvasToWorld = (p: number[]): number[] => {
    const { offset, scale } = this.appState;
    return [p[0] / scale - offset[0], p[1] / scale - offset[1]];
  }

  // world coordinates to canvas coordinates
  worldToCanvas = (p: number[]): number[] => {
    const { offset, scale } = this.appState;
    return [(p[0] + offset[0]) * scale, (p[1] + offset[1]) * scale];
  }

  // world coordinates to tile coordinates
  worldToTile = (p: number[], round = true): number[] => {
    if (round) {
      const S = this.size / this.appState.gridSteps;
      return [Math.round(p[0] / S) / this.appState.gridSteps, Math.round(p[1] / S) / this.appState.gridSteps];
    }
    return [p[0] / this.size, p[1] / this.size];
  }

  canvasToTile = (p: number[]) => {
    return this.worldToTile(this.canvasToWorld(p));
  }

  renderTextCenter(text: string, font: string) {
    this.ctx.font = font;
    const m = this.ctx.measureText(text);
    let h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    this.ctx.fillText(text, -m.width / 2, h);
  }

  renderFPS(time: number) {
    const fps = (1000 / (time - this.lastTime)).toFixed(0);
    this.ctx.translate(this.canvas.width - 48, 12);
    this.renderTextCenter(fps, "18px Roboto Mono, monospace");
  }

  clearScreen() {
    const { canvas, ctx, bufferCanvas } = this;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bufferCanvas.width !== canvas.width || bufferCanvas.height !== canvas.height) {
      bufferCanvas.width = canvas.width;
      bufferCanvas.height = canvas.height;
    }
  }

  drawGrid() {
    const { canvas, ctx } = this;
    const iT = ctx.getTransform().inverse();
    const min = iT.transformPoint({ x: 0, y: 0 });
    const max = iT.transformPoint({ x: canvas.width, y: canvas.height });
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#000';
    for (let x = Math.floor(min.x / this.size) * this.size; x <= max.x; x += this.size) {
      ctx.beginPath();
      ctx.moveTo(x, min.y);
      ctx.lineTo(x, max.y);
      ctx.stroke();
    }
    for (let y = Math.floor(min.y / this.size) * this.size; y <= max.y; y += this.size) {
      ctx.beginPath();
      ctx.moveTo(min.x, y);
      ctx.lineTo(max.x, y);
      ctx.stroke();
    }
    if (this.appState.gridSteps !== 1) {
      ctx.lineWidth = 0.25;
      ctx.strokeStyle = '#666666';
      for (let x = Math.floor(min.x / this.size) * this.size; x <= max.x; x += this.size / this.appState.gridSteps) {
        ctx.beginPath();
        ctx.moveTo(x, min.y);
        ctx.lineTo(x, max.y);
        ctx.stroke();
      }
      for (let y = Math.floor(min.y / this.size) * this.size; y <= max.y; y += this.size / this.appState.gridSteps) {
        ctx.beginPath();
        ctx.moveTo(min.x, y);
        ctx.lineTo(max.x, y);
        ctx.stroke();
      }
    }
  }

  drawMousePos(mouse: number[]) {
    const { ctx } = this;
    const p = this.worldToTile(this.canvasToWorld(mouse), true);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(p[0], p[1], 0.1, 0, 2 * Math.PI);
    ctx.fill();

    if (this.appState.debug) {
      const font = "0.5px Roboto, sans-serif";
      ctx.translate(p[0], p[1] - 1);
      this.renderTextCenter(`Mouse: ${mouse[0].toFixed(0)},${mouse[1].toFixed(0)}`, font);
      ctx.translate(0, -0.5);
      this.renderTextCenter(`World: ${p[0].toFixed(0)},${p[1].toFixed(0)}`, font);
      ctx.translate(0, -0.5);
      this.renderTextCenter(`Tile: ${Math.floor(p[0] / this.size).toFixed(0)},${Math.floor(p[1] / this.size).toFixed(0)}`, font);
    }
  }

  drawDrag() {
    const { drag, appState } = this;
    if (!drag) return;
    const { start, end } = drag;
    if (dist(start, end) > 1 && appState.tools.rect.selected) {
      this.drawGeometry(
        { type: 'polygon', coordinates: [start, [start[0], end[1]], end, [end[0], start[1]]] },
        dragFillColor, dragStrokeColor);
    } else if (dist(start, end) > 1 && appState.tools.stairs.selected) {
      const stairs = detectStairsPlacement(start, end, appState.levels[appState.selection.levelIndex].features);
      if (stairs) {
        this.drawStairs([stairs.from, stairs.to], undefined, dragStrokeColor);
      }
    } else if (dist(start, end) > 1 && appState.tools.ellipse.selected) {
      const box = bbox([start, end]);
      this.drawEllipse([box.sw, box.ne], dragFillColor, dragStrokeColor);
    } else {
      this.drawLine([start, end], dragStrokeColor);
    }
  }

  drawGeometry(geometry: Geometry, fillColor?: string, strokeColor?: string) {
    if (geometry.type === 'polygon') {
      this.drawPolygon(geometry.coordinates, fillColor, strokeColor);
    } else if (geometry.type === 'ellipse') {
      this.drawEllipse(geometry.coordinates, fillColor, strokeColor);
    } else if (geometry.type === 'line') {
      this.drawLine(geometry.coordinates, strokeColor);
    } else if (geometry.type === 'brush') {
      this.drawBrush(geometry.coordinates, fillColor, strokeColor);
    } else if (geometry.type === 'door') {
      this.drawDoor(geometry.coordinates, fillColor, strokeColor);
    } else if (geometry.type === 'stairs') {
      this.drawStairs(geometry.coordinates, fillColor, strokeColor);
    }
  }

  drawPolygon(points: number[][], fillColor?: string, strokeColor?: string) {
    const { ctx } = this;
    this.pathPoints(points, true);
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.1;
      ctx.stroke();
    }
    if (fillColor && specialColors.includes(fillColor)) {
      this.drawPoints(points);
      const box = bbox(points);
      ctx.fillStyle = '#000';
      ctx.save();
      ctx.translate(box.sw[0] + box.w / 2, box.ne[1] - 1);
      this.renderTextCenter(`${box.w * 5}ft x ${box.h * 5}ft`, "1px Roboto, sans-serif");
      ctx.restore();
    }
  }

  drawEllipse(points: number[][], fillColor?: string, strokeColor?: string) {
    const { ctx } = this;
    this.pathEllipse(points, true);
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.1;
      ctx.stroke();
    }
    if (fillColor && specialColors.includes(fillColor)) {
      const box = bbox(points);
      this.drawPoints([box.sw, [box.sw[0], box.ne[1]], box.ne, [box.ne[0], box.sw[1]]]);
      ctx.fillStyle = '#000';
      ctx.save();
      ctx.translate(box.sw[0] + box.w / 2, box.ne[1] - 1);
      this.renderTextCenter(`${box.w * 5}ft x ${box.h * 5}ft`, "1px Roboto, sans-serif");
      ctx.restore();
    }
  }

  drawLine(points: number[][], strokeColor?: string) {
    const { ctx } = this;
    this.pathPoints(points);
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.1;
      ctx.stroke();
    }
  }

  drawBrush(points: number[][], fillColor?: string, strokeColor?: string) {
    const { ctx } = this;
    this.pathPoints(points);
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    if (fillColor) {
      ctx.strokeStyle = fillColor;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    if (fillColor && specialColors.includes(fillColor)) {
      this.drawPoints(points);
    }
  }

  drawDoor(points: number[][], fillColor?: string, strokeColor?: string) {
    const { ctx } = this;
    const [from, to] = points;
    const a = lerp2(0.1, from, to);
    const b = lerp2(0.9, from, to);
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'butt';
      ctx.lineWidth = 0.1;
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
      ctx.stroke();
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
  }

  drawStairs(points: number[][], fillColor?: string, strokeColor?: string) {
    if (!strokeColor) return;
    const { ctx } = this;
    const [from, to] = points;
    const w = Math.abs(to[0] - from[0]);
    const h = Math.abs(to[1] - from[1]);
    const sx = Math.sign(to[0] - from[0]);
    const sy = Math.sign(to[1] - from[1]);
    const L = Math.max(w, h);
    const W = Math.min(w, h);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.1;
    ctx.lineCap = 'butt';
    for (let i = 0; i <= L; i += 0.5) {
      const l = (i + 0.5) / (L + 0.5);
      ctx.beginPath();
      if (w > h) {
        ctx.moveTo(from[0] + i * sx, Math.min(from[1], to[1]) + (W - l) / 2);
        ctx.lineTo(from[0] + i * sx, Math.min(from[1], to[1]) + (W - l) / 2 + l);
      } else {
        ctx.moveTo(Math.min(from[0], to[0]) + (W - l) / 2, from[1] + i * sy);
        ctx.lineTo(Math.min(from[0], to[0]) + (W - l) / 2 + l, from[1] + i * sy);
      }
      ctx.stroke();
    }
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(from[0], to[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.lineTo(to[0], from[1]);
    ctx.stroke();
    if (strokeColor && specialColors.includes(strokeColor)) {
      this.drawPoints(points);
    }
  }

  drawPoints(points: number[][]) {
    const { ctx } = this;
    ctx.fillStyle = pointColor;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.05;
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.ellipse(points[i][0], points[i][1], 0.25, 0.25, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  pathPoints(points: number[][], close: boolean = false) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    if (close) ctx.closePath();
  }

  pathEllipse(points: number[][], close: boolean = false) {
    const { ctx } = this;
    const [a, b] = points;
    ctx.beginPath();
    ctx.ellipse(a[0] + (b[0] - a[0]) / 2, a[1] + (b[1] - a[1]) / 2, (b[0] - a[0]) / 2, (a[1] - b[1]) / 2, 0, 0, 2 * Math.PI);
    if (close) ctx.closePath();
  }

  drawFeatures(level: Level, colorIndex: boolean = false) {
    const featureDrawOrder = ['room', 'wall', 'text'];
    const geometryDrawOrder = ['polygon', 'ellipse', 'line', 'brush', 'door', 'stairs'];
    const overdraw = ['polygon', 'ellipse', 'brush'];
    featureDrawOrder.forEach(featureType => {
      geometryDrawOrder.forEach(geometryType => {
        level.features.forEach((feature, i) => {
          if (feature.properties.type !== featureType) return;
          this.ctx.globalCompositeOperation = 'source-over';
          feature.geometries.forEach((geometry, j) => {
            if (geometry.type !== geometryType) return;
            if (colorIndex) {
              this.drawGeometry(geometry, indexToColor(j + i * level.features.length), indexToColor(j + i * level.features.length));
            } else {
              this.drawGeometry(geometry, floorColor, overdraw.includes(geometryType) ? undefined : wallColor);
            }
          });
          if (overdraw.includes(geometryType)) {
            this.ctx.globalCompositeOperation = 'destination-over';
            feature.geometries.forEach((geometry, j) => {
              if (geometry.type !== geometryType) return;
              if (colorIndex) {
                this.drawGeometry(geometry, indexToColor(j + i * level.features.length), indexToColor(j + i * level.features.length));
              } else {
                this.drawGeometry(geometry, undefined, wallColor);
              }
            });
          }
        });
      });
    });
  }

  drawLevels() {
    const { appState } = this;
    const { width, height } = this.canvas;

    const tmp = this.ctx;
    const level = this.appState.levels[this.appState.selection.levelIndex];

    this.ctx = this.bufferCtx;

    // color-indexed mouse picking
    this.ctx.resetTransform();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.save();
    this.ctx.scale(appState.scale, appState.scale);
    this.ctx.translate(appState.offset[0], appState.offset[1]);
    this.ctx.scale(this.size, this.size);
    this.drawFeatures(level, true);
    if (this.mouse) {
      const p = this.ctx.getImageData(this.mouse[0], this.mouse[1], 1, 1).data;
      const i = colorToIndex(p[0], p[1], p[2]);
      const [featureIndex, geometryIndex] = [Math.floor(i / level.features.length), i % level.features.length];
      if (featureIndex === Infinity || featureIndex >= level.features.length || geometryIndex >= level.features[featureIndex].geometries.length) {
        this.hover = undefined;
      } else {
        this.hover = { featureIndex, geometryIndex };
      }
    }
    this.ctx.restore();

    // setup transform and clear buffer
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.save();
    this.ctx.scale(appState.scale, appState.scale);
    this.ctx.translate(appState.offset[0], appState.offset[1]);
    this.ctx.scale(this.size, this.size);

    this.drawFeatures(level);

    if (appState.tools.pointer.selected) {
      if (this.hover !== undefined && this.hover.featureIndex !== undefined) {
        const hover = level.features[this.hover.featureIndex];
        if (this.hover.geometryIndex !== undefined && hover !== undefined) {
          this.drawGeometry(hover.geometries[this.hover.geometryIndex], hoverFillColor, hoverStrokeColor);
        }
      }
      const selection = this.appState.getSelectedFeature();
      if (selection) {
        this.drawGeometry(selection.geometry, selectionFillColor, selectionStrokeColor);
        if (this.drag && dist(this.drag.start, this.drag.end)) {
          this.ctx.save();
          const deltaDrag = [this.drag.end[0] - this.drag.start[0], this.drag.end[1] - this.drag.start[1]];
          this.ctx.translate(deltaDrag[0], deltaDrag[1]);
          selection.feature.geometries.forEach(geometry => {
            this.drawGeometry(geometry, dragFillColor, dragStrokeColor);
          });
          this.ctx.restore();
        }
      }
    }

    this.ctx.globalCompositeOperation = 'source-over';
    if (appState.tools.doors.selected && this.mouse) {
      const door = detectDoorPlacement(
        this.worldToTile(this.canvasToWorld(this.mouse), false),
        level.features);
      if (door) {
        this.drawDoor([door.from, door.to], undefined, wallColor);
      }
    }
    this.ctx.restore();

    tmp.drawImage(this.bufferCanvas, 0, 0);

    this.ctx = tmp;
  }

  render = (time: number) => {
    const { ctx, appState } = this;
    const { tools } = appState;
    if (this.polygonToolSelected && !appState.tools.polygon.selected) {
      this.points = [];
    }
    this.polygonToolSelected = appState.tools.polygon.selected;

    ctx.resetTransform();
    this.bufferCtx.resetTransform();

    ctx.save();
    this.clearScreen();
    ctx.restore();

    // http://jeroenhoek.nl/articles/svg-and-isometric-projection.html
    // ctx.transform(0.866, 0.5, -0.866, 0.5, 0, 0);

    ctx.save();
    this.drawLevels();
    ctx.restore();

    ctx.save();

    ctx.scale(appState.scale, appState.scale);
    ctx.translate(appState.offset[0], appState.offset[1]);

    ctx.save();
    this.drawGrid();
    ctx.restore();

    ctx.save();
    ctx.scale(this.size, this.size);

    if (this.mouse) {
      ctx.save();
      this.drawMousePos(this.mouse);
      ctx.restore();
    }

    if (this.points.length > 0 && tools.polygon.selected) {
      this.drawPolygon(this.points, dragFillColor, dragStrokeColor);
    } else if (this.points.length > 0 && tools.brush.selected) {
      this.drawBrush(this.points, dragFillColor, dragStrokeColor);
    } else if (this.drag) {
      this.drawDrag();
    }
    ctx.restore();

    ctx.restore();

    if (appState.debug) {
      ctx.save();
      this.renderFPS(time);
      ctx.restore();
    }
    this.lastTime = time;
    this.requestID = requestAnimationFrame(this.render);
  }
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appState = useContext(Context);
  useEffect(() => {
    if (canvasRef.current === null) return;
    const canvas = canvasRef.current;
    const syncSize = () => {
      canvas.width = canvas.offsetWidth || canvas.width;
      canvas.height = canvas.offsetHeight || canvas.height;
    };
    syncSize();
    window.addEventListener('resize', syncSize);
    if ((canvas as any).renderer === undefined) {
      (canvas as any).renderer = new CanvasRenderer(canvas);
    }
    (canvas as any).renderer.appState = appState;
    return () => {
      window.removeEventListener('resize', syncSize);
    }
  }, [canvasRef, appState]);
  return <canvas ref={canvasRef} style={{ flex: '1 1 auto' }} />;
}
