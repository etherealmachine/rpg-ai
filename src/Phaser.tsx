import React from 'react';
import styled from 'styled-components';
import Phaser from 'phaser';

import GameState from './GameState';

import Loading from './scenes/Loading';
import HexMap from './scenes/HexMap';
import OrthoMap from './scenes/OrthoMap';

interface Props {
  game: GameState;
}

const Game = styled.div`
  width: 100%;
  height: 100%;
`;

function setupPhaser(el: HTMLElement, game: GameState) {
  const gameConfig = {
    parent: el,
    width: el.offsetWidth,
    height: el.offsetHeight,
    pixelArt: true,
  };
  const phaser = new Phaser.Game(gameConfig);
  phaser.scene.add('Loading', Loading, true);
  phaser.scene.add('OrthoMap', OrthoMap, false, { game: game });
  phaser.scene.add('HexMap', HexMap, false, { game: game });
  el.addEventListener('click', () => {
    (document.activeElement as any).blur();
    el.focus();
  })
}

export default function Map(props: Props) {
  return <Game ref={el => el && setupPhaser(el, props.game)} />;
}