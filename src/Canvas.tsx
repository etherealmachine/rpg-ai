import React, { useContext, useEffect, useRef } from 'react';
import { colorToIndex, dist, indexToColor } from './lib';

import { Context, Feature, State } from './State';
import { isPolygonFeature, isMultiPointFeature } from './GeoJSON';

interface Pos {
  x: number
  y: number
}

const floorColor = '#F1ECE0';
const shadowColor = '#999';
const backgroundColor = '#D9D2BF';
const highlightColor = '#2f5574';

class CanvasRenderer {
  mouse?: Pos = undefined
  mouseDown: boolean = false
  drag?: {
    start: Pos
    end: Pos
  }
  points: Pos[] = []
  polygonToolSelected: boolean = false
  hoverIndex?: number
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

  onMouseDown = () => {
    this.mouseDown = true;
    const { mouse } = this;
    if (mouse) {
      this.drag = {
        start: { ...mouse },
        end: { ...mouse },
      }
    }
    if (this.appState.tools.pointer.selected && this.hoverIndex !== undefined) {
      this.appState.setSelection({ ...this.appState.selection, featureIndex: this.hoverIndex });
    }
  }

  onMouseUp = () => {
    this.mouseDown = false;
    if (this.drag) {
      const [from, to] = this.getBoundingRect(
        this.canvasToWorld(this.drag.start),
        this.canvasToWorld(this.drag.end));
      from.x = Math.round(from.x / this.size);
      from.y = Math.round(from.y / this.size);
      to.x = Math.round(to.x / this.size);
      to.y = Math.round(to.y / this.size);
      this.appState.handleDrag(from, to);
      this.drag = undefined;
    }
    if (this.mouse && this.appState.tools.polygon.selected) {
      const worldPos = this.canvasToWorld(this.mouse);
      if (this.points.length >= 1 && dist(this.points[0].x, this.points[0].y, worldPos.x, worldPos.y) < this.size) {
        this.appState.handlePolygon(this.points.map(p => ({ x: p.x / this.size, y: p.y / this.size })));
        this.points = [];
      } else {
        worldPos.x = Math.round(worldPos.x / this.size) * this.size;
        worldPos.y = Math.round(worldPos.y / this.size) * this.size;
        this.points.push(worldPos);
      }
    } else {
      if (this.appState.tools.brush.selected) {
        // TODO
      }
      this.points = [];
    }
  }

  onMouseMove = (event: MouseEvent) => {
    this.mouse = {
      x: event.offsetX,
      y: event.offsetY,
    };
    if (this.mouse && this.mouseDown && this.drag) {
      this.drag.end = { ...this.mouse };
      if (this.appState.tools.brush) {
        this.points.push(this.canvasToWorld(this.mouse));
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
    const newMouseWorldPos = { x: mouse.x / newScale - offset.x, y: mouse.y / newScale - offset.y };
    const newOffset = {
      x: offset.x - (mouseWorldPos.x - newMouseWorldPos.x),
      y: offset.y - (mouseWorldPos.y - newMouseWorldPos.y)
    }
    this.appState.setZoom(newScale, newOffset);
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (document.activeElement !== document.body) return;
    const { appState } = this;
    const S = this.size * this.appState.scale;
    let newOffset = appState.offset;
    if (event.key === 'w') newOffset = { x: appState.offset.x, y: appState.offset.y + S };
    if (event.key === 'a') newOffset = { x: appState.offset.x + S, y: appState.offset.y };
    if (event.key === 's') newOffset = { x: appState.offset.x, y: appState.offset.y - S };
    if (event.key === 'd') newOffset = { x: appState.offset.x - S, y: appState.offset.y };
    if (newOffset !== appState.offset) {
      appState.setOffset(newOffset);
    }
  }

  // canvas coordinates to world coordinates
  canvasToWorld(p: Pos): Pos {
    const { offset, scale } = this.appState;
    return { x: p.x / scale - offset.x, y: p.y / scale - offset.y };
  }

  // world coordinates to canvas coordinates
  worldToCanvas(p: Pos): Pos {
    const { offset, scale } = this.appState;
    return { x: (p.x + offset.x) * scale, y: (p.y + offset.y) * scale };
  }

  // world coordinates to tile coordinates
  worldToTile(p: Pos): Pos {
    return { x: Math.floor(p.x / this.size), y: Math.floor(p.y / this.size) };
  }

  mouseToTile(mouse: Pos) {
    const p = this.canvasToWorld(mouse);
    p.x = Math.floor(p.x / this.size);
    p.y = Math.floor(p.y / this.size);
    return p;
  }

  getBoundingRect(from: Pos, to: Pos) {
    let x1 = Math.min(from.x, to.x);
    let y1 = Math.min(from.y, to.y);
    let x2 = Math.max(from.x, to.x);
    let y2 = Math.max(from.y, to.y);
    x1 = Math.round(x1 / this.size) * this.size;
    y1 = Math.round(y1 / this.size) * this.size;
    x2 = Math.round(x2 / this.size) * this.size;
    y2 = Math.round(y2 / this.size) * this.size;
    return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
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
  }

  drawMousePos(mouse: Pos, halfGrid: boolean = false) {
    const { ctx } = this;
    const p = this.canvasToWorld(mouse);
    const d = halfGrid ? 2 : 1;
    const closestGridPoint = {
      x: Math.round(p.x / (this.size / d)) * (this.size / d),
      y: Math.round(p.y / (this.size / d)) * (this.size / d),
    }
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(closestGridPoint.x, closestGridPoint.y, 2, 0, 2 * Math.PI);
    ctx.fill();

    if (this.appState.debug) {
      const font = "14px Roboto, sans-serif";
      ctx.translate(p.x, p.y - 16);
      this.renderTextCenter(`Mouse: ${mouse.x.toFixed(0)},${mouse.y.toFixed(0)}`, font);
      ctx.translate(0, -16);
      this.renderTextCenter(`World: ${p.x.toFixed(0)},${p.y.toFixed(0)}`, font);
      ctx.translate(0, -16);
      this.renderTextCenter(`Tile: ${Math.floor(p.x / this.size).toFixed(0)},${Math.floor(p.y / this.size).toFixed(0)}`, font);
    }
  }

  drawRectSelection(from: Pos, to: Pos) {
    const { ctx } = this;
    const [a, b] = this.getBoundingRect(from, to);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x, b.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, a.y);
    ctx.lineTo(a.x, a.y);
    ctx.stroke();

    const w = Math.abs(a.x - b.x) / this.size;
    const h = Math.abs(a.y - b.y) / this.size;
    ctx.translate(a.x + (b.x - a.x) / 2, a.y - 14);
    ctx.fillStyle = '#000';
    this.renderTextCenter(`${w} x ${h}`, "14px Roboto, sans-serif");
  }

  drawEllipseSelection(from: Pos, to: Pos) {
    const { ctx } = this;
    const [a, b] = this.getBoundingRect(from, to);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x, b.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, a.y);
    ctx.lineTo(a.x, a.y);
    ctx.stroke();

    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.beginPath();
    ctx.ellipse((b.x - a.x) / 2, (b.y - a.y) / 2, (b.x - a.x) / 2, (b.y - a.y) / 2, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    const w = Math.abs(a.x - b.x) / this.size;
    const h = Math.abs(a.y - b.y) / this.size;
    ctx.translate(a.x + (b.x - a.x) / 2, a.y - 14);
    ctx.fillStyle = '#000';
    this.renderTextCenter(`${w} x ${h}`, "14px Roboto, sans-serif");
  }

  drawLineSelection(from: Pos, to: Pos) {
    const { ctx, size } = this;
    const S = size / 2;
    from.x = Math.round(from.x / S) * S;
    from.y = Math.round(from.y / S) * S;
    to.x = Math.round(to.x / S) * S;
    to.y = Math.round(to.y / S) * S;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    if (to.x > from.x) ctx.translate(to.x + 14, to.y - 7);
    else ctx.translate(to.x - 14, to.y - 7);
    ctx.fillStyle = '#000';
    this.renderTextCenter(`${Math.floor(dist(from.x, from.y, to.x, to.y) / size).toFixed(0)}`, "14px Roboto, sans-serif");
  }

  drawPolygonSelection(points: Pos[]) {
    const { ctx } = this;
    ctx.fillStyle = '#000';
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 2, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  drawBrushSelection(points: Pos[]) {
    const { ctx } = this;
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  drawDrag() {
    const { drag, size, appState } = this;
    if (drag) {
      const start = this.canvasToWorld(drag.start);
      const end = this.canvasToWorld(drag.end);
      if (dist(start.x, start.y, end.x, end.y) > size && appState.tools.rect.selected) {
        this.drawRectSelection(start, end);
      } else if (dist(start.x, start.y, end.x, end.y) > size && appState.tools.ellipse.selected) {
        this.drawEllipseSelection(start, end);
      } else {
        this.drawLineSelection(start, end);
      }
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, width: number, style: string) {
    const { ctx } = this;
    ctx.lineWidth = width;
    ctx.strokeStyle = style;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  drawFeature(feature: Feature, color?: string, outline: boolean = false) {
    const { ctx } = this;
    if (feature.type === 'Feature') {
      if (isPolygonFeature(feature)) {
        if (color) ctx.fillStyle = color;
        this.drawPolygon(feature);
        if (color) ctx.fill();
      } else if (isMultiPointFeature(feature) && feature.properties.shape === 'ellipse') {
        if (color) ctx.fillStyle = color;
        this.drawEllipse(feature);
        if (color) ctx.fill();
      } else if (isMultiPointFeature(feature) && feature.properties.shape === 'line') {
        if (color) {
          const points = feature.geometry.coordinates;
          const [from, to] = points;
          this.drawLine(from[0], from[1], to[0], to[1], 0.1, color);
        }
      } else {
        throw new Error(`Can't draw ${feature.geometry.type}`);
      }
      if (outline) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
    }
  }

  drawPolygon(feature: GeoJSON.Feature<GeoJSON.Polygon, GeoJSON.GeoJsonProperties>) {
    const { ctx } = this;
    const points = feature.geometry.coordinates.flat();
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
  }

  drawEllipse(feature: GeoJSON.Feature<GeoJSON.MultiPoint, GeoJSON.GeoJsonProperties>) {
    const { ctx } = this;
    const points = feature.geometry.coordinates;
    const [from, to] = points;
    let a = { x: from[0], y: from[1] };
    let b = { x: to[0], y: to[1] };
    ctx.beginPath();
    ctx.ellipse(a.x + (b.x - a.x) / 2, a.y + (b.y - a.y) / 2, (b.x - a.x) / 2, (b.y - a.y) / 2, 0, 0, 2 * Math.PI);
    ctx.closePath();
  }

  drawLayers() {
    const { appState } = this;
    const { width, height } = this.canvas;

    const tmp = this.ctx;

    this.ctx = this.bufferCtx;
    this.ctx.resetTransform();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.save();
    this.ctx.scale(appState.scale, appState.scale);
    this.ctx.translate(appState.offset.x, appState.offset.y);
    this.ctx.scale(this.size, this.size);

    const layer = this.appState.layers[this.appState.selection.layerIndex];
    layer.features.forEach((features, featureIndex) => {
      this.ctx.save();
      this.drawFeature(features, indexToColor(featureIndex));
      this.ctx.restore();
    });

    if (this.mouse) {
      const p = this.ctx.getImageData(this.mouse.x, this.mouse.y, 1, 1).data;
      this.hoverIndex = colorToIndex(p[0], p[1], p[2]);
    }
    this.ctx.restore();

    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.scale(appState.scale, appState.scale);
    this.ctx.translate(appState.offset.x, appState.offset.y);
    this.ctx.scale(this.size, this.size);
    layer.features.forEach(features => {
      this.ctx.save();
      this.drawFeature(features, shadowColor);
      this.ctx.restore();
    });
    this.ctx.save();
    this.ctx.translate(0.3, 0.3);
    this.ctx.globalCompositeOperation = 'source-atop';
    layer.features.forEach((features, i) => {
      this.ctx.save();
      this.drawFeature(features, (this.hoverIndex === i || this.appState.selection.featureIndex === i) ? highlightColor : floorColor);
      this.ctx.restore();
    });
    this.ctx.restore();
    this.ctx.globalCompositeOperation = 'destination-over';
    layer.features.forEach(features => {
      this.ctx.save();
      this.drawFeature(features, undefined, true);
      this.ctx.restore();
    });

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
    this.drawLayers();
    ctx.restore();

    ctx.save();
    ctx.scale(appState.scale, appState.scale);
    ctx.translate(appState.offset.x, appState.offset.y);
    ctx.save();
    this.drawGrid();
    ctx.restore();
    if (this.mouse) {
      ctx.save();
      this.drawMousePos(this.mouse, tools.doors.selected);
      ctx.restore();
    }
    if (this.drag && (tools.rect.selected || tools.ellipse.selected || tools.doors.selected)) {
      this.drawDrag();
    } else if (this.points.length > 0 && tools.polygon.selected) {
      this.drawPolygonSelection(this.points);
    } else if (this.points.length > 0 && tools.brush.selected) {
      this.drawBrushSelection(this.points);
    }
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
