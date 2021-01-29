import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

import OrthoMap from './OrthoMap';
import TilemapUI from './TilemapUI';

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

function setupPhaser(parent: HTMLElement, width: number, height: number, args: any) {
  const gameConfig = {
    parent: parent,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: width,
      height: height,
      zoom: 1 / window.devicePixelRatio,
    },
  }
  const phaser = new Phaser.Game(gameConfig);
  phaser.scene.add('OrthoMap', OrthoMap, false, args);
  return phaser;
}

function Tilemap(props: { tilemap: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if ((window as any).phaser !== undefined) return;
    ref.current.addEventListener('click', () => {
      (document.activeElement as any).blur();
      ref.current.focus();
    });
    const onResize = () => {
      let phaser = (window as any).phaser as Phaser.Game | undefined;
      const W = window.innerWidth;
      const H = window.innerHeight - ref.current.offsetTop;
      ref.current.parentElement.setAttribute('style', `width: ${W}px; height: ${H}px; position: relative`);
      ref.current.setAttribute('style', `width: ${W}px; height: ${H}px`);
      if (phaser === undefined) {
        phaser = setupPhaser(ref.current, W, H, { tilemap: props.tilemap });
        (window as any).phaser = phaser;
      }
    };
    window.addEventListener('resize', onResize);
    setTimeout(onResize, 0);
  });
  return <div>
    <div style={{ width: "100%", height: "100%" }} ref={ref} />
    <TilemapUI {...props} />
  </div>
}

export default Tilemap;