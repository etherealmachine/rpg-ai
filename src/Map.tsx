import React from 'react';
import styled from 'styled-components';
import Phaser from 'phaser';

import GameState from './GameState';

import LoadMap from './scenes/LoadMap';
import HexMap from './scenes/HexMap';
import OrthoMap from './scenes/OrthoMap';

interface Props {
  game: GameState;
}

const Game = styled.div`
  width: 100%;
  height: 100%;
`;

const setup = new Set<HTMLElement>();

function setupPhaser(el: HTMLElement, game: GameState) {
  if (setup.has(el)) return;
  setup.add(el);
  const gameConfig = {
    parent: el,
    width: el.offsetWidth,
    height: el.offsetHeight,
    pixelArt: true,
  }
  const phaser = new Phaser.Game(gameConfig);
  const params = new URLSearchParams(window.location.search);
  phaser.scene.add('LoadMap', LoadMap, true, { mapID: params.get('map') });
  phaser.scene.add('OrthoMap', OrthoMap, false, { game: game });
  phaser.scene.add('HexMap', HexMap, false, { game: game });
  el.addEventListener('click', () => {
    (document.activeElement as any).blur();
    el.focus();
  });
  el.setAttribute('style', `width: ${el.offsetWidth}px; height: ${el.offsetHeight}px`);
}

export default function Map(props: Props) {
  return <Game ref={el => el && setupPhaser(el, props.game)} />;
}