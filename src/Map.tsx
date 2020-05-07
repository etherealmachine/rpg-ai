import React from 'react';
import styled from 'styled-components';
import Phaser from 'phaser';

import LoadMap from './scenes/LoadMap';
import HexMap from './scenes/HexMap';
import OrthoMap from './scenes/OrthoMap';

interface Props {
  MapID: number
}

const Game = styled.div`
  width: 100%;
  height: 100%;
`;

const setup = new Set<HTMLElement>();

function setupPhaserMap(el: HTMLElement, mapID: number) {
  if (setup.has(el)) return;
  setup.add(el);
  const gameConfig = {
    parent: el,
    width: el.offsetWidth,
    height: el.offsetHeight,
    pixelArt: true,
  }
  const phaser = new Phaser.Game(gameConfig);
  phaser.scene.add('LoadMap', LoadMap, true, { mapID: mapID });
  phaser.scene.add('OrthoMap', OrthoMap, false);
  phaser.scene.add('HexMap', HexMap, false);
  el.addEventListener('click', () => {
    (document.activeElement as any).blur();
    el.focus();
  });
  el.setAttribute('style', `width: ${el.offsetWidth}px; height: ${el.offsetHeight}px`);
}

export default function Map(props: Props) {
  return <Game ref={el => el && setupPhaserMap(el, props.MapID)} />;
}