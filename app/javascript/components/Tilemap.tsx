import React, { useEffect, useRef, useState } from 'react';
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

function setupPhaser(parent: HTMLElement, width: number, height: number, args: any) {
  const gameConfig = {
    parent: parent,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
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
      ref.current.parentElement.setAttribute('style', `width: ${W}px; height: ${H}px`);
      ref.current.setAttribute('style', `width: ${W}px; height: ${H}px`);
      if (phaser === undefined) {
        phaser = setupPhaser(ref.current, W, H, { tilemap: props.tilemap });
        (window as any).phaser = phaser;
      }
      phaser.scale.setZoom(1 / window.devicePixelRatio);
      phaser.scale.resize(W, H);
    };
    window.addEventListener('resize', onResize);
    setTimeout(onResize, 0);
  });
  const characters = {
    'Caster': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAASdJREFUOI1jYKAQMCZPNf3PwMDAMCfrFCM5BrAwMDAwiCnxMqRMM/sPM2T1hIL/2BSHFkzAsIQFXWD1hIL/1qZ6WG1bPaHgP7ohTPyHWRg0jgkw8B/GMIsowIRLYs/OrVjZeA0ojrSC+93F3ZsBG7s40up/caTV/x8/fvzHMMDZxpjh+7vHOG37/u4xg7ONMYOzjTHDvrmlDAwMWAJRRFwK7mSYzTC+iLgUitpFdcH/UVzw5uUzBqfkbgYRcSm4QXt2boXznZK7Gd68fIZiCIYLYE7DZiOyHNyA4pwUBgYGBoaLt+dg9zgBwMzw7XXDt/fPGV6++8IgIczLwMXDi1fDt6+f4ZhTSBbTC8QAWOAePX2JPAOOnr7EwMAAyRsYBqCHMjaAnB8ALTJoyQMLhpYAAAAASUVORK5CYII=',
    'Cleric': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAR1JREFUOI1jYBhowMjAwMDw//9/FMHVEwr+Y1McWjCBkaABqycU/Lc21cNq29HTlzAMYSLRxRgApwF7dm7FykYHjAwMDAzfv3//X53oxMDAwMBgYW7GgM8LJ06eYmBgYGBonb+PgYODg5GRgYGBYeuUHHggvHn5jMHF3Runq0TEpeB8r+zJjIwLa4P+IwvCDGFgYIAbBPMCNnVM6AJOyd0MIuJSDCLiUgx7dm6F2yoiLsXglNwNNxwGWNCduW9uKZztkNLPwMDAwHBlczeGHAzgjAUd31KsbHTAwikky/Dm5WOcCrABmDc4hWQhLnBx98YIeZiz0dno6lnCCicyrurPx5r2cYGjpy8xMDBA8gZKXlhUF0yUQXFNa+H5AQDpfGnnFHMeOQAAAABJRU5ErkJggg==',
    'Adventurer': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAXRJREFUOI2lk6FLA3EUxz83F8bK0oaHoANZGKgrU2cc+GPBIkv+AUaDaDkWDAZ3RTCIyWa0aDDIhAWLysoshjGD4U6HZSg4MDyD/H7evBMRHzz4vu+77/e994OD/4aIICLU63URkT9pRIQ4gOu6opTCdV0BrFarFelULBat70NiGti2DcBP4p96cQ183zekPWhHGviJQoiLfSfuL48AuDg/M5zGuhe5gT5Bx2JlKRLnt2rmjLvtHSsWJACurm8i19e91PSUyfxWTcwJ+g0KOZuql6DqJYxQ14WcHTKNh5hABE0AvOQsy90HAE4mxwGwNlYWJOjc7viRk7zkLEopUzcaDSYTj8RK83O0Oz6LlaUh8evbu0ktTqfTJpVSdAejnydsrq2GJmazEwbfvnzxmUyGXq83/Aa7+4ehtZ+fvK8iOWZgUAxgiQjHe+sCcHDaJpVKAVCdGfn1DRzHsYZ+jnK5LNqg3+/TbDatIF8qlcy3juNYAB/bqp9bkLjuagAAAABJRU5ErkJggg==',
  };
  const [character, setCharacter] = useState<string | null>(null);
  const onCharacterSelect = (name: string, sprite: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const phaser = (window as any).phaser as Phaser.Game | undefined;
    phaser.scene.start('OrthoMap', { tilemap: props.tilemap, character: { name, sprite } });
    setCharacter(name);
  };
  return <div style={{ width: "100%", height: "100%" }}>
    <div style={{ width: "100%", height: "100%" }} ref={ref} />
    <div className={"modal" + (character ? "" : " d-block")} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select a Character</h5>
          </div>
          <div className="modal-body">
            <div className="d-flex">
              {Object.entries(characters).map(([name, sprite]) => <div key={name} className="d-flex flex-column align-items-center mx-2">
                <button className="btn btn-secondary d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }} onClick={onCharacterSelect(name, sprite)}>
                  <img width="80" height="80" style={{ imageRendering: 'pixelated' }} src={sprite} />
                </button>
                <label className="mt-2">{name}</label>
              </div>)}
              <div className="d-flex flex-column align-items-center mx-2">
                <button className="btn btn-secondary" style={{ width: '100px', height: '100px' }}>
                  <i className="fa fa-plus"></i>
                </button>
                <label className="mt-2">Custom</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default Tilemap;