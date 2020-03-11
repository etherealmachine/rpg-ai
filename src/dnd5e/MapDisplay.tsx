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
    this.state?.encounter.forEach((m, i) => {
      this.load.image(m.name, `${process.env.PUBLIC_URL}/images/${m.name}`);
    });
    this.load.loadComplete = this.onLoad.bind(this);
    this.load.start();
  }

  onLoad() {
    this.state?.encounter.forEach((m, i) => {
      const sprite = this.add.image((i + 1) * 200, (i + 1) * 200, m.name);
      sprite.setScale(0.2);
    });
  }

  preload() {
    this.load.image('map', `${process.env.PUBLIC_URL}/images/Slitherswamp.jpg`);
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