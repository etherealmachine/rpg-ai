import React from 'react';
import styled from 'styled-components';
import Phaser from 'phaser';

import { Tilemap } from './AssetService';
import { Character, Encounter } from './CampaignService';
import LoadMap from './scenes/LoadMap';
import HexMap from './scenes/HexMap';
import OrthoMap from './scenes/OrthoMap';

interface Props {
  Encounter: Encounter
  Tilemap: Tilemap
  Character: Character
}

const PhaserContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const setup = new Set<HTMLElement>();

function setupPhaserMap(el: HTMLElement, map: Tilemap) {
  if (setup.has(el)) return;
  setup.add(el);
  const gameConfig = {
    parent: el,
    width: el.offsetWidth,
    height: el.offsetHeight,
    pixelArt: true,
  }
  const phaser = new Phaser.Game(gameConfig);
  phaser.scene.add('LoadMap', LoadMap, true, { map: map });
  phaser.scene.add('OrthoMap', OrthoMap, false);
  phaser.scene.add('HexMap', HexMap, false);
  el.addEventListener('click', () => {
    (document.activeElement as any).blur();
    el.focus();
  });
  el.setAttribute('style', `width: ${el.offsetWidth}px; height: ${el.offsetHeight}px`);
}

export default class EncounterUI extends React.Component<Props> {
  render() {
    return <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <PhaserContainer ref={el => el && setupPhaserMap(el, this.props.Tilemap)} />
    </div>;
  }
}