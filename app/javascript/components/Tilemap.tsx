import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

import OrthoMap from './OrthoMap';

export interface Tilemap {
  width: number
  height: number
  tilewidth: number
  tileheight: number
  tilesets: Tileset[]
  tiles: Tile[]
}

export interface Tile {
  index: number
  layer: number
  tilemap_tileset_id: number
  x: number
  y: number
}

export interface Tileset {
  id: number
  source: string
  tileset: {
    tilewidth: number
    tileheight: number
    margin: number
    spacing: number
    image_url: string
  }
}

function Tilemap(props: { tilemap: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const W = window.innerWidth;
    const H = window.innerHeight - ref.current.offsetTop;
    const gameConfig = {
      parent: ref.current,
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: W,
        height: H,
      },
    }
    const phaser = new Phaser.Game(gameConfig);
    phaser.scene.add('OrthoMap', OrthoMap, true, { tilemap: props.tilemap });
    ref.current.addEventListener('click', () => {
      (document.activeElement as any).blur();
      ref.current.focus();
    });
    window.addEventListener('resize', () => {
      const W = window.innerWidth;
      const H = window.innerHeight - ref.current.offsetTop;
      ref.current.setAttribute('style', `width: ${W}px; height: ${H}px`)
    });
  });
  return <div style={{ width: "100%", height: "100%" }} ref={ref} />;
}

export default Tilemap;