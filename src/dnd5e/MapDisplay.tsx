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
    this.add.image(0, 0, 'map');
    if (this.state?.map) {
      this.load.image('map', `${process.env.PUBLIC_URL}/images/dnd5e/maps/${encodeURIComponent(this.state.map.name)}`);
    }
    this.state?.encounter.forEach((m, i) => {
      this.load.image(m.name, `${process.env.PUBLIC_URL}/images/dnd5e/tokens/${encodeURIComponent(m.name)}`);
    });
    this.load.loadComplete = this.onLoad.bind(this);
    this.load.start();
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }

  onLoad() {
    if (this.state === undefined || this.state.map === undefined) return;
    const map = this.add.image(0, 0, 'map').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    const tileSize = map.width / this.state.map.width;
    this.state.encounter.forEach((m, i) => {
      if (m.status === undefined) return;
      const sprite = this.add.image(m.status.x * tileSize, m.status.y * tileSize, m.name).setOrigin(0, 0);
      if (this.state === undefined || this.state.map === undefined) return;
      sprite.setScale(map.width / (sprite.width * this.state.map.width));
    });
    const cursors = this.input.keyboard.createCursorKeys();

    var controlConfig = {
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      acceleration: 0.5,
      drag: 0.01,
      maxSpeed: 2.0,
    };
    this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);
  }

}

function setupPhaser(el: HTMLElement, game: GameState) {
  const gameConfig = {
    parent: el,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const phaser = new Phaser.Game(gameConfig);
  phaser.scene.add('Map', MapScene, true, { game: game });
}

export default function MapDisplay(props: Props) {
  return <Game ref={el => el && setupPhaser(el, props.game)} />;
}