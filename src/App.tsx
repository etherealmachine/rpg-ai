import React, { useEffect, useRef } from 'react';
import { css } from 'astroturf';

const classes = css`
  .app {
    width: 100vw;
    height: 100vh;
  }
  .ui {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

interface CanvasState {
  mouseX?: number
  mouseY?: number
}

function render(canvas: HTMLCanvasElement | undefined, state: CanvasState) {
  if (canvas === undefined) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (state.mouseX !== undefined && state.mouseY !== undefined) {
    ctx.beginPath();
    ctx.arc(state.mouseX, state.mouseY, 50, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
  }, []);
  return (
    <div className={classes.app}>
      <canvas ref={canvasRef} />
      <div className={classes.ui}>
      </div>
    </div>
  );
}

export default App;
