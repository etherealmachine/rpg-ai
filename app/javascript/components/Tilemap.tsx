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
    const gameConfig = {
      parent: ref.current,
      width: ref.current.offsetWidth,
      height: ref.current.offsetHeight,
      pixelArt: true,
    }
    const phaser = new Phaser.Game(gameConfig);
    phaser.scene.add('OrthoMap', OrthoMap, true, { tilemap: props.tilemap });
    ref.current.addEventListener('click', () => {
      (document.activeElement as any).blur();
      ref.current.focus();
    });
  });
  return <div style={{ height: "100%", width: "100%" }} ref={ref} />;
}

export default Tilemap;