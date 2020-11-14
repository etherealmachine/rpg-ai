import React, { useContext, useEffect, useRef } from 'react';
import { dist } from './lib';

import { Context, State } from './State';
import { isPolygonFeature, isMultiPointFeature } from './GeoJSON';

interface Pos {
  x: number
  y: number
}

class CanvasRenderer {
  mouse?: Pos = undefined
  mouseDown: boolean = false
  drag?: {
    start: Pos
    end: Pos
  }
  points: Pos[] = []
  size: number = 30
  lastTime: number = 0
  requestID?: number
  appState = new State()
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('canvas has null rendering context');
    }
    this.canvas = canvas;
    this.ctx = ctx
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('wheel', this.onWheel);
    this.requestID = requestAnimationFrame(this.render);
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
      this.appState.handleRect(from, to);
      this.drag = undefined;
    }
    if (this.mouse && this.appState.tools.polygon.selected) {
      const worldPos = this.canvasToWorld(this.mouse);
      worldPos.x = Math.round(worldPos.x / this.size) * this.size;
      worldPos.y = Math.round(worldPos.y / this.size) * this.size;
      this.points?.push(worldPos);
    }
  }

  onMouseMove = (event: MouseEvent) => {
    this.mouse = {
      x: event.offsetX,
      y: event.offsetY,
    };
    if (this.mouse && this.mouseDown && this.drag) {
      this.drag.end = { ...this.mouse };
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
    this.ctx.translate(this.canvas.width - 18, 12);
    this.renderTextCenter(fps, "18px Roboto Mono, monospace");
  }

  clearScreen() {
    const { canvas, ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#D9D2BF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

  drawRectSelection(from: Pos, to: Pos, overlay: boolean = false) {
    const { ctx } = this;
    const [a, b] = this.getBoundingRect(from, to);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#2f5574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x, b.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, a.y);
    ctx.lineTo(a.x, a.y);
    ctx.stroke();

    if (this.mouse) {
      const mousePos = this.canvasToWorld(this.mouse);
      if (mousePos.x >= a.x && mousePos.x <= b.x && mousePos.y >= a.y && mousePos.y <= b.y) {
        overlay = true;
      }
    }
    if (overlay) {
      ctx.fillStyle = 'rgb(47, 85, 116, 0.1)';
      ctx.fillRect(a.x, a.y, (b.x - a.x), (b.y - a.y));
    }

    const w = Math.abs(a.x - b.x) / this.size;
    const h = Math.abs(a.y - b.y) / this.size;
    ctx.translate(a.x + (b.x - a.x) / 2, a.y - 14);
    ctx.fillStyle = '#000';
    this.renderTextCenter(`${w} x ${h}`, "14px Roboto, sans-serif");
  }

  drawEllipseSelection(from: Pos, to: Pos, overlay: boolean = false) {
    const { ctx } = this;
    const [a, b] = this.getBoundingRect(from, to);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#2f5574';
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

    if (this.mouse) {
      const mousePos = this.canvasToWorld(this.mouse);
      if (mousePos.x >= a.x && mousePos.x <= b.x && mousePos.y >= a.y && mousePos.y <= b.y) {
        overlay = true;
      }
    }
    if (overlay) {
      ctx.fillStyle = 'rgb(47, 85, 116, 0.1)';
      ctx.fillRect(a.x, a.y, (b.x - a.x), (b.y - a.y));
    }

    const w = Math.abs(a.x - b.x) / this.size;
    const h = Math.abs(a.y - b.y) / this.size;
    ctx.translate(a.x + (b.x - a.x) / 2, a.y - 14);
    ctx.fillStyle = '#000';
    this.renderTextCenter(`${w} x ${h}`, "14px Roboto, sans-serif");
  }

  drawPolygonSelection(points: Pos[], overlay: boolean = false) {
    const { ctx } = this;
    ctx.fillStyle = '#000';
    for (let i = 0; i < points.length; i++) {
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 2, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#2f5574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // TODO: mouse intersection & overlay
  }

  drawDrag() {
    if (this.drag) {
      const start = this.canvasToWorld(this.drag.start);
      const end = this.canvasToWorld(this.drag.end);
      if (dist(start.x, start.y, end.x, end.y) > this.size && this.appState.tools.rect.selected) {
        this.drawRectSelection(start, end);
      } else if (dist(start.x, start.y, end.x, end.y) > this.size && this.appState.tools.ellipse.selected) {
        this.drawEllipseSelection(start, end);
      } else {
        this.ctx.strokeStyle = '#000';
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
      }
    }
  }

  drawTile(style?: string) {
    const { ctx } = this;
    ctx.fillStyle = style || '#F1ECE0';
    ctx.beginPath();
    ctx.fillRect(0, 0, this.size, this.size);
  }

  drawHoverTile(style?: string) {
    const { ctx } = this;
    if (this.mouse) {
      const p = this.canvasToWorld(this.mouse);
      ctx.translate(
        Math.floor(p.x / this.size) * this.size,
        Math.floor(p.y / this.size) * this.size);
      this.drawTile(style);
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

  drawFeature(feature: GeoJSON.Feature) {
    if (feature.type === 'Feature') {
      if (isPolygonFeature(feature)) {
        this.drawPolygon(feature);
      } else if (isMultiPointFeature(feature)) {
        this.drawEllipse(feature);
      } else {
        throw new Error(`Can't draw ${feature.geometry.type}`);
      }
    }
  }

  drawPolygon(feature: GeoJSON.Feature<GeoJSON.Polygon, GeoJSON.GeoJsonProperties>) {
    const { ctx } = this;
    const points = feature.geometry.coordinates.flat();

    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F1ECE0';
    ctx.save();
    ctx.clip();
    ctx.translate(0.2, 0.2);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.stroke();

    if (this.appState.debug) {
      ctx.strokeStyle = '#49ce3d';
      ctx.lineWidth = 0.2;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.stroke();

      points.forEach((p, i) => {
        ctx.fillStyle = '#fffb00';
        ctx.beginPath();
        ctx.arc(p[0], p[1], 0.2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.save();
        ctx.translate(p[0], p[1]);
        this.renderTextCenter(`${i}`, '1px Roboto, sans-serif');
        ctx.restore();
      });
    }
  }

  drawEllipse(feature: GeoJSON.Feature<GeoJSON.MultiPoint, GeoJSON.GeoJsonProperties>) {
    const { ctx } = this;
  }

  drawLayers() {
    const { ctx, appState } = this;
    ctx.scale(this.size, this.size);
    const layer = appState.layers[appState.selection.layerIndex];
    layer.features.forEach(features => {
      this.drawFeature(features);
    });
  }

  render = (time: number) => {
    const { ctx, appState } = this;
    const { tools } = appState;

    ctx.resetTransform();

    ctx.save();
    this.clearScreen();
    ctx.restore();

    ctx.save();
    this.renderFPS(time);
    ctx.restore();

    ctx.save();
    ctx.scale(appState.scale, appState.scale);
    ctx.translate(appState.offset.x, appState.offset.y);

    // http://jeroenhoek.nl/articles/svg-and-isometric-projection.html
    // ctx.transform(0.866, 0.5, -0.866, 0.5, 0, 0);

    ctx.save();
    this.drawLayers();
    ctx.restore();

    ctx.save();
    this.drawGrid();
    ctx.restore();

    if (tools.walls.selected) {
      ctx.save();
      this.drawHoverTile();
      ctx.restore();
    } else if (!tools.eraser.selected && this.mouse) {
      ctx.save();
      this.drawMousePos(this.mouse, tools.doors.selected);
      ctx.restore();
    }

    if (this.drag && (tools.rect.selected || tools.ellipse.selected || tools.doors.selected)) {
      ctx.save();
      this.drawDrag();
      ctx.restore();
    } else if (this.points.length > 0 && tools.polygon.selected) {
      ctx.save();
      this.drawPolygonSelection(this.points);
      ctx.restore();
    }
    if (tools.eraser.selected) {
      ctx.save();
      this.drawHoverTile("rgba(220, 53, 68, 0.2)");
      ctx.restore();
    }

    ctx.restore();

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
