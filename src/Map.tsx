import React from 'react';
import styled from 'styled-components';
import Phaser from 'phaser';

import { Tilemap } from './AssetService';
import LoadMap from './scenes/LoadMap';
import HexMap from './scenes/HexMap';
import OrthoMap from './scenes/OrthoMap';

interface Props {
  Map: Tilemap
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

interface State {
  name?: string
  description?: string
}

export default class Map extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    (window as any).emitter.on('hoveron', (event: any) => {
      this.setState({
        name: event.name,
        description: event.description,
      });
    });
    (window as any).emitter.on('hoveroff', (event: any) => {
      this.setState({
        name: undefined,
        description: undefined,
      });
    });
  }

  render() {
    return <div style={{ height: "100%", width: "100%", position: "relative" }}>
      {this.state.name && this.state.description &&
        <div className="card" style={{ position: "absolute", right: 0 }}>
          <div className="card-body">
            <h5 className="card-title">{this.state.name}</h5>
            <p>{this.state.description}</p>
          </div>
        </div>}
      <PhaserContainer ref={el => el && setupPhaserMap(el, this.props.Map)} />
    </div>;
  }
}