import React, { useContext, useEffect, useRef } from 'react';
import { sqDist } from './lib';

import { clearTile, Context, initialState, Pos, setTile, State } from './State';

class CanvasRenderer {
  mouse?: Pos = undefined
  mouseDown: boolean = false
  drag?: {
    start: Pos
    end: Pos
  }
  size: number = 30
  lastTime: number = 0
  requestID?: number
  appState: State = initialState
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
    this.requestID = requestAnimationFrame(this.render);
  }

  onMouseDown = () => {
    this.mouseDown = true;
    if (this.mouse) {
      this.drag = {
        start: { ...this.mouse },
        end: { ...this.mouse },
      }
    }
  }

  onMouseUp = () => {
    this.mouseDown = false;
    if (this.drag) {
      this.drag = undefined;
    }
  }

  onMouseMove = (event: MouseEvent) => {
    this.mouse = {
      x: event.clientX,
      y: event.clientY,
    };
    if (this.mouse && this.mouseDown && this.drag) {
      this.drag.end = { ...this.mouse };
    }
    if (this.appState.tools.brush.selected && this.mouse && this.mouseDown) {
      const x = Math.floor(this.mouse.x / this.size);
      const y = Math.floor(this.mouse.y / this.size);
      if (!this.appState.map.get(x, y)) {
        setTile(this.appState, { x, y });
      }
    } else if (this.appState.tools.eraser.selected && this.mouse && this.mouseDown) {
      const x = Math.floor(this.mouse.x / this.size);
      const y = Math.floor(this.mouse.y / this.size);
      if (this.appState.map.get(x, y)) {
        clearTile(this.appState, { x, y });
      }
    }
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
    for (let x = 0; x < canvas.width; x += this.size) {
      for (let y = 0; y < canvas.height; y += this.size) {
        ctx.lineWidth = 0.1;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.rect(x, y, this.size, this.size);
        ctx.stroke();
      }
    }
  }

  drawMousePos() {
    const { ctx } = this;
    if (this.mouse) {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(
        Math.round(this.mouse.x / this.size) * this.size,
        Math.round(this.mouse.y / this.size) * this.size,
        2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  drawDrag() {
    const { ctx } = this;
    if (this.drag) {
      let x1 = Math.round(this.drag.start.x / this.size) * this.size;
      let y1 = Math.round(this.drag.start.y / this.size) * this.size;
      let x2 = Math.round(this.drag.end.x / this.size) * this.size;
      let y2 = Math.round(this.drag.end.y / this.size) * this.size;
      if (sqDist(0, 0, x2, y2) < sqDist(0, 0, x1, y1)) {
        let tmp = [x1, y1];
        [x1, y1] = [x2, y2];
        [x2, y2] = tmp;
      }
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x1, y1, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y2, 2, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#2f5574';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      const w = Math.abs(x1 - x2) / this.size;
      const h = Math.abs(y1 - y2) / this.size;
      ctx.translate(x1 + (x2 - x1) / 2, y1 - 14);
      this.renderTextCenter(`${w} x ${h}`, "14px Roboto, sans-serif");
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
      ctx.translate(
        Math.floor(this.mouse.x / this.size) * this.size,
        Math.floor(this.mouse.y / this.size) * this.size);
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

  drawWalls(x: number, y: number) {
    const { ctx, appState } = this;
    const up = appState.map.get(x, y - 1);
    const down = appState.map.get(x, y + 1);
    const left = appState.map.get(x - 1, y);
    const right = appState.map.get(x + 1, y);
    const shadowWidth = Math.round(this.size * 0.25);
    const halfShadowWidth = Math.round(shadowWidth / 2);
    ctx.lineWidth = shadowWidth;
    ctx.strokeStyle = "#999";
    if (!up && !left && right) {
      ctx.beginPath();
      ctx.moveTo(halfShadowWidth, this.size);
      ctx.lineTo(halfShadowWidth, halfShadowWidth);
      ctx.lineTo(this.size + shadowWidth, halfShadowWidth);
      ctx.stroke();
    } else if (!up && !left && !right) {
      ctx.beginPath();
      ctx.moveTo(halfShadowWidth, this.size);
      ctx.lineTo(halfShadowWidth, halfShadowWidth);
      ctx.lineTo(this.size, halfShadowWidth);
      ctx.stroke();
    } else if (!up && !right) {
      // TODO: miter left if no left
      ctx.beginPath();
      ctx.moveTo(0, halfShadowWidth);
      ctx.lineTo(this.size, halfShadowWidth);
      ctx.stroke();
    } else if (!up && right) {
      // TODO: miter left if no left
      ctx.beginPath();
      ctx.moveTo(0, halfShadowWidth);
      ctx.lineTo(this.size + shadowWidth, halfShadowWidth);
      ctx.stroke();
    } else if (!left) {
      // TODO: miter top
      ctx.beginPath();
      ctx.moveTo(halfShadowWidth, 0);
      ctx.lineTo(halfShadowWidth, this.size);
      ctx.stroke();
    }
    if (!up) this.drawLine(0, 0, this.size, 0, 2, '#000');
    if (!down) this.drawLine(0, this.size, this.size, this.size, 2, '#000');
    if (!left) this.drawLine(0, 0, 0, this.size, 2, '#000');
    if (!right) this.drawLine(this.size, 0, this.size, this.size, 2, '#000');
  }

  drawMap() {
    const { ctx, appState } = this;
    appState.map.forEach((occupied, pos) => {
      if (occupied) {
        ctx.save();
        ctx.translate(pos.x * this.size, pos.y * this.size);
        this.drawTile();
        ctx.restore();
      }
    });
    appState.map.forEach((occupied, pos) => {
      if (occupied) {
        ctx.save();
        ctx.translate(pos.x * this.size, pos.y * this.size);
        this.drawWalls(pos.x, pos.y);
        ctx.restore();
      }
    });
    appState.map.forEach((occupied, pos) => {
      if (occupied) {
        ctx.save();
        ctx.translate(pos.x * this.size, pos.y * this.size);
        this.drawLine(0, 0, this.size, 0, 1, 'rgba(0, 0, 0, 0.2)');
        this.drawLine(0, 0, 0, this.size, 1, 'rgba(0, 0, 0, 0.2)');
        this.drawLine(this.size, 0, this.size, this.size, 0.1, '#000');
        this.drawLine(0, this.size, this.size, this.size, 0.1, '#000');
        ctx.restore();
      }
    });
  }

  render = (time: number) => {
    const { ctx, appState } = this;

    ctx.save();
    this.clearScreen();
    ctx.restore();

    ctx.save();
    this.renderFPS(time);
    ctx.restore();

    ctx.save();
    this.drawGrid();
    ctx.restore();

    if (appState.tools.brush.selected) {
      ctx.save();
      this.drawHoverTile();
      ctx.restore();
    } else if (!appState.tools.eraser.selected) {
      ctx.save();
      this.drawMousePos();
      ctx.restore();
    }

    ctx.save();
    this.drawMap();
    ctx.restore();

    if (appState.tools.box.selected || appState.tools.circle.selected) {
      ctx.save();
      this.drawDrag();
      ctx.restore();
    }
    if (appState.tools.eraser.selected) {
      ctx.save();
      this.drawHoverTile("rgba(220, 53, 68, 0.2)");
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
      canvas.width = canvas.parentElement?.offsetWidth || canvas.width;
      canvas.height = canvas.parentElement?.offsetHeight || canvas.height;
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
  return <canvas ref={canvasRef} />;
}
