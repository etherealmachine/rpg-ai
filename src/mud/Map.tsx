import React from 'react';
import styled from 'styled-components';
import Phaser from 'phaser';

import GameState from './GameState';

interface Props {
  game: GameState;
}

const Game = styled.div`
  width: 100%;
  height: 100%;
`;

export class MapScene extends Phaser.Scene {
  state?: GameState
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl

  init(args: any) {
    this.state = args.game;
  }

  create() {
    this.load.loadComplete = this.onLoad.bind(this);
    this.load.image('characters', `${process.env.PUBLIC_URL}/images/mud/characters.png`);
    this.load.image('dungeon', `${process.env.PUBLIC_URL}/images/mud/dungeon.png`);
    this.load.image('indoors', `${process.env.PUBLIC_URL}/images/mud/indoors.png`);
    this.load.image('general', `${process.env.PUBLIC_URL}/images/mud/general.png`);
    this.load.start();
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }

  onLoad() {
    const cursors = this.input.keyboard.createCursorKeys();
    const controlConfig = {
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      acceleration: 0.5,
      drag: 0.01,
      maxSpeed: 2.0,
      zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };
    this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);
    this.cameras.main.setBackgroundColor('#ddd');
    const level = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 3, 0, 0, 0, 1, 2, 3, 0],
      [0, 5, 6, 7, 0, 0, 0, 5, 6, 7, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 14, 13, 14, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 14, 14, 14, 14, 14, 0, 0, 0, 15],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 15],
      [35, 36, 37, 0, 0, 0, 0, 0, 15, 15, 15],
      [39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39]
    ];
    const map = this.make.tilemap({ data: level, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage("general", "general", 16, 16, 0, 1);
    const layer = map.createStaticLayer(0, tiles, 0, 0);
  }

}

function setupPhaser(el: HTMLElement, game: GameState) {
  const gameConfig = {
    parent: el,
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
  const phaser = new Phaser.Game(gameConfig);
  phaser.scene.add('Map', MapScene, true, { game: game });
  el.addEventListener('click', () => {
    (document.activeElement as any).blur();
    el.focus();
  })
}

export default function Map(props: Props) {
  return <Game ref={el => el && setupPhaser(el, props.game)} />;
}