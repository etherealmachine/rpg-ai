import React from 'react';
import styled from 'styled-components';

import GameState from './GameState';

interface Props {
  game: GameState;
}

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
`;

interface Vertex {
  x: number
  y: number
}

function getMousePos(canvas: HTMLCanvasElement, mouseEvent: MouseEvent): Vertex {
  const rect = canvas.getBoundingClientRect();
  return {
    x: mouseEvent.clientX - rect.left,
    y: mouseEvent.clientY - rect.top
  };
}

function renderGameState(game: GameState, canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let [offsetX, offsetY] = [0, 0];
  let mouse: Vertex | null = null;
  canvas.addEventListener("mousedown", (e) => {
    mouse = getMousePos(canvas, e);
  }, false);
  canvas.addEventListener("mouseup", (e) => {
    mouse = null;
  }, false);
  canvas.addEventListener("mousemove", (e) => {
    if (mouse) {
      const newMouse = getMousePos(canvas, e);
      offsetX += mouse.x - newMouse.x;
      offsetY += mouse.y - newMouse.y;
      mouse = newMouse;
      ctx?.drawImage(map, offsetX, offsetY);
    }
  }, false);
  const ctx = canvas.getContext('2d');
  const map = new Image();
  map.onload = () => {
    ctx?.drawImage(map, offsetX, offsetY);
  };
  map.src = `${process.env.PUBLIC_URL}/images/Slitherswamp.jpg`;
}

export default function MapDisplay(props: Props) {
  return <Canvas ref={el => el && renderGameState(props.game, el)} />;
}