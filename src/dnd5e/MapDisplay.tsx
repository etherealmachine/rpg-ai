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
  state?: GameState;

  init(args: any) {
    this.state = args.game;
  }

  create() {
    this.add.image(0, 0, 'map');
    if (this.state?.map) {
      this.load.image('map', `${process.env.PUBLIC_URL}/images/${this.state.map.name}`);
    }
    this.state?.encounter.forEach((m, i) => {
      this.load.image(m.name, `${process.env.PUBLIC_URL}/images/${m.name}`);
    });
    this.load.loadComplete = this.onLoad.bind(this);
    this.load.start();
  }

  onLoad() {
    if (this.state === undefined || this.state.map === undefined) return;
    const map = this.add.image(0, 0, 'map');
    const tileSize = map.width / this.state.map.scale;
    console.log(tileSize);
    this.state.encounter.forEach((m, i) => {
      if (m.status === undefined) return;
      const sprite = this.add.image(m.status.x * tileSize, m.status.y * tileSize, m.name);
      if (this.state === undefined || this.state.map === undefined) return;
      sprite.setScale(map.width / (sprite.width * this.state.map.scale));
    });
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