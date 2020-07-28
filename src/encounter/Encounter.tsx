import React from 'react';

import { Tilemap, ListSpritesheetsForTilemapRow } from '../AssetService';
import { Character, Encounter } from '../CampaignService';
import { Tilemap as TiledTilemap, TilemapLayer, TilesetSource, Tileset } from '../Tiled';

interface Props {
  Encounter: Encounter
  Tilemap: Tilemap
  Spritesheets: ListSpritesheetsForTilemapRow[]
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
    const tilesetIndex = this.state.tilemap.tilesets.findIndex(tileset => index <= tileset.firstgid) - 1;
    const tileset = this.state.tilemap.tilesets[tilesetIndex];
    if (tileset === undefined) return <td style={{ width: this.state.tilemap.tilewidth, height: this.state.tilemap.tileheight }}></td>;
    if ((tileset as TilesetSource).source === undefined) return null;
    const spritesheet = this.props.Spritesheets.find(spritesheet => spritesheet.SpritesheetName === (tileset as TilesetSource).source);
    if (spritesheet === undefined) return <td style={{ width: this.state.tilemap.tilewidth, height: this.state.tilemap.tileheight }}></td>;
    const definition = (spritesheet.SpritesheetDefinition as unknown) as Tileset;
    const offset = index - tileset.firstgid;
    const x = offset % definition.columns;
    const y = Math.floor(offset / definition.columns);
    const xPosition = -x * (definition.tilewidth + definition.spacing + definition.margin);
    const yPosition = -y * (definition.tileheight + definition.spacing + definition.margin);
    return <td
      data-tile={`${definition.name}-${x}-${y}`}
      style={{
        width: this.state.tilemap.tilewidth,
        height: this.state.tilemap.tileheight,
        padding: 0,
        backgroundImage: `url("/spritesheet/image/${spritesheet.SpritesheetHash}")`,
        backgroundPosition: `${xPosition}px ${yPosition}px`,
      }}
    />;
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
    return <table data-layer={layer.name} style={{ position: 'absolute', top: 0, left: 0 }}>
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