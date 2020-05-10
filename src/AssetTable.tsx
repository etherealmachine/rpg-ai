import React from 'react';

import AssetService, { Spritesheet, TilemapWithThumbnails } from './AssetService';

interface State {
  Tilemaps: TilemapWithThumbnails[]
  Spritesheets: Spritesheet[]
}

export default class AssetTable extends React.Component<State, State> {

  constructor(props: State) {
    super(props);
    this.state = props;
    if (!props.Tilemaps || !props.Spritesheets) {
      AssetService.ListAssets({}).then(resp => {
        const state = {
          Tilemaps: resp.Tilemaps || [],
          Spritesheets: resp.Spritesheets || [],
        };
        this.setState(state);
      });
    }
  }

  onDeleteSpritesheetClicked = (spritesheet: Spritesheet) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    AssetService.DeleteSpritesheet({ ID: spritesheet.ID }).then(() => {
      AssetService.ListAssets({}).then(resp => {
        const state = {
          ...this.state,
          Tilemaps: resp.Tilemaps || [],
          Spritesheets: resp.Spritesheets || [],
        };
        this.setState(state);
      });
    });
  }

  onDeleteTilemapClicked = (tilemap: TilemapWithThumbnails) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    AssetService.DeleteTilemap({ ID: tilemap.ID }).then(() => {
      AssetService.ListAssets({}).then(resp => {
        const state = {
          ...this.state,
          Tilemaps: resp.Tilemaps || [],
          Spritesheets: resp.Spritesheets || [],
        };
        this.setState(state);
      });
    });
  }

  tilemapThumbnail(asset: TilemapWithThumbnails) {
    if (!asset.Thumbnails) return;
    if (asset.Thumbnails?.length > 0) {
      return <img width="150px" src={`/thumbnail/${asset.Thumbnails[0].Hash}`} alt={`Thumbnail for Tilemap ${asset.Name}`} />;
    }
    return null;
  }

  spritesheetThumbnail(asset: Spritesheet) {
    return <img width="150px" src={`/spritesheet/image/${asset.Hash}`} alt={`Thumbnail for Spritesheet ${asset.Name}`} />;
  }

  render() {
    return <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Thumbnail</th>
          <th>Uploaded At</th>
        </tr>
      </thead>
      <tbody>
        {this.state.Tilemaps && this.state.Tilemaps.map(asset => <tr key={asset.Name}>
          <td><a href={`/map/${asset.Hash}`}>{asset.Name}</a></td>
          <td>{this.tilemapThumbnail(asset)}</td>
          <td>{asset.CreatedAt}</td>
          <td><button type="button" className="btn btn-danger" onClick={this.onDeleteTilemapClicked(asset)}>Delete</button></td>
        </tr>
        )}
        {this.state.Spritesheets && this.state.Spritesheets.map(asset => <tr key={asset.Name}>
          <td>{asset.Name}</td>
          <td>{this.spritesheetThumbnail(asset)}</td>
          <td>{asset.CreatedAt}</td>
          <td><button type="button" className="btn btn-danger" onClick={this.onDeleteSpritesheetClicked(asset)}>Delete</button></td>
        </tr>
        )}
      </tbody>
    </table>;
  }
}