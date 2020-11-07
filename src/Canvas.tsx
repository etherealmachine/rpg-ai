import React, { useContext, useEffect, useRef } from 'react';
import { Context, State } from './State';

interface Pos {
  x: number
  y: number
}

interface CanvasState {
  mouse?: Pos
  mouseDown: boolean
  drag?: {
    start: Pos
    end: Pos
  }
  size: number
  lastTime: number
}

function renderTextCenter(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, text: string, font: string) {
  ctx.font = font;
  const m = ctx.measureText(text);
  let h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  ctx.fillText(text, -m.width / 2, h);
}

function renderFPS(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, time: number, state: CanvasState) {
  const fps = (1000 / (time - state.lastTime)).toFixed(0);
  ctx.translate(canvas.width - 18, 12);
  renderTextCenter(canvas, ctx, fps, "18px Roboto Mono, monospace");
}

function clearScreen(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, time: number, state: CanvasState) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#D9D2BF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, time: number, state: CanvasState) {
  for (let x = 0; x < canvas.width; x += state.size) {
    for (let y = 0; y < canvas.height; y += state.size) {
      ctx.lineWidth = 0.1;
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.rect(x, y, state.size, state.size);
      ctx.stroke();
    }
  }
}

function drawMousePos(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, time: number, state: CanvasState) {
  if (state.mouse) {
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.arc(
      Math.round(state.mouse.x / state.size) * state.size,
      Math.round(state.mouse.y / state.size) * state.size,
      2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawDrag(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, time: number, state: CanvasState) {
  if (state.drag) {
    const x1 = Math.round(state.drag.start.x / state.size) * state.size;
    const y1 = Math.round(state.drag.start.y / state.size) * state.size;
    const x2 = Math.round(state.drag.end.x / state.size) * state.size;
    const y2 = Math.round(state.drag.end.y / state.size) * state.size;
    ctx.beginPath();
    ctx.fillStyle = '#000';
    ctx.arc(x1, y1, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x2, y2, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#2f5574';
    ctx.lineWidth = 2;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1, y2);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    const w = Math.abs(x1 - x2) / state.size;
    const h = Math.abs(y1 - y2) / state.size;
    ctx.translate(x1 + (x2 - x1) / 2, y1 - 14);
    renderTextCenter(canvas, ctx, `${w} x ${h}`, "14px Roboto, sans-serif");
  }
}

let requestID: number | undefined;

function render(canvas: HTMLCanvasElement | null, time: number, state: CanvasState, appState: State) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  clearScreen(canvas, ctx, time, state);
  ctx.restore();

  ctx.save();
  renderFPS(canvas, ctx, time, state);
  ctx.restore();

  ctx.save();
  drawGrid(canvas, ctx, time, state);
  ctx.restore();

  if (appState.tools.circle.selected) {
    ctx.save();
    drawMousePos(canvas, ctx, time, state);
    ctx.restore();
  }

  ctx.save();
  drawDrag(canvas, ctx, time, state);
  ctx.restore();

  state.lastTime = time;
  requestID = requestAnimationFrame(time => render(canvas, time, state, appState));
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appState = useContext(Context);
  useEffect(() => {
    if (canvasRef.current === null) return;
    canvasRef.current.id = 'canvas';
    canvasRef.current.width = canvasRef.current.parentElement?.offsetWidth || canvasRef.current.width;
    canvasRef.current.height = canvasRef.current.parentElement?.offsetHeight || canvasRef.current.height;
    const state: CanvasState = {
      mouseDown: false,
      size: 25,
      lastTime: 0,
    };
    canvasRef.current.addEventListener('mousedown', event => {
      state.mouseDown = true;
      if (state.mouse) {
        state.drag = {
          start: { ...state.mouse },
          end: { ...state.mouse },
        }
      }
    });
    canvasRef.current.addEventListener('mouseup', event => {
      state.mouseDown = false;
      state.drag = undefined;
    });
    canvasRef.current.addEventListener('mousemove', event => {
      state.mouse = {
        x: event.clientX,
        y: event.clientY,
      };
      if (state.mouse && state.drag) {
        state.drag.end = { ...state.mouse };
      }
    });
    requestID = requestAnimationFrame(time => render(canvasRef.current, time, state, appState));
    return () => { if (requestID) cancelAnimationFrame(requestID); };
  }, [canvasRef, appState]);
  return <canvas ref={canvasRef} />;
}
