import React from 'react';

import { Tilemap, Spritesheet } from '../AssetService';
import { Character, Encounter } from '../CampaignService';
import { Tilemap as TiledTilemap, TilemapLayer } from '../Tiled';

interface Props {
  Encounter: Encounter
  Tilemap: Tilemap
  Spritesheets: Spritesheet[]
  Character: Character
}

interface State {
  tilemap: TiledTilemap
}

export default class EncounterUI extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      tilemap: ((props.Tilemap.Definition as unknown) as TiledTilemap),
    };
    (window as any).encounter = this;
  }

  tile(index: number) {
    const hash = "YCzQzxouPVqCPDzfxQO9OKkT9bqLkAQ44veTeeCDW7E6vY0pTFI/54B44hIxRqK50sDy3Tz7vWDeyPUIw/6MLA==";
    return < td style={{ width: this.state.tilemap.tilewidth, height: this.state.tilemap.tileheight, padding: 0 }} >
      <img
        alt=""
        src={`/spritesheet/image/${hash}`}
        style={{ objectFit: 'cover' }}
        width={this.state.tilemap.tilewidth}
        height={this.state.tilemap.tileheight}>
      </img>
    </ td >;
  }

  layer(layer: TilemapLayer) {
    const rows = [];
    for (let i = 0; i < layer.height; i++) {
      const row = [];
      for (let j = 0; j < layer.width; j++) {
        row.push(<React.Fragment key={`cell-${i}-${j}`}>
          {this.tile(layer.data[i * layer.width + j])}
        </React.Fragment>);
      }
      rows.push(<tr key={`row-${i}`} style={{ lineHeight: 0 }}>
        {row}
      </tr>);
    }
    return <table style={{ position: 'absolute', top: 0, left: 0 }}>
      <tbody>
        {rows}
      </tbody>
    </table >;
  }

  render() {
    const width = this.state.tilemap.layers[0].width * this.state.tilemap.tilewidth;
    const height = this.state.tilemap.layers[0].height * this.state.tilemap.tileheight;
    return <div className="d-flex flex-column justify-content-center align-items-center">
      <div style={{ position: 'relative', width: width, height: height }}>
        {this.state.tilemap.layers.map(layer => <React.Fragment key={layer.name}>{this.layer(layer)}</React.Fragment>)}
      </div>
    </div>;
  }
}