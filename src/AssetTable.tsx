import React from 'react';

import AssetService, { Spritesheet, TilemapWithThumbnail } from './AssetService';

interface State {
  Tilemaps: TilemapWithThumbnail[]
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

  onDeleteClicked = (asset: TilemapWithThumbnail | Spritesheet) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if ((asset as Spritesheet).Image) {
      asset = asset as Spritesheet;
      AssetService.DeleteSpritesheet({ ID: asset.ID }).then(() => {
        AssetService.ListAssets({}).then(resp => {
          const state = {
            ...this.state,
            Tilemaps: resp.Tilemaps || [],
            Spritesheets: resp.Spritesheets || [],
          };
          this.setState(state);
        });
      });
    } else {
      asset = asset as TilemapWithThumbnail;
      AssetService.DeleteTilemap({ ID: asset.ID }).then(() => {
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
  }

  tilemapThumbnail(asset: TilemapWithThumbnail) {
    if (!asset.Thumbnails) return;
    if (asset.Thumbnails?.length > 0) {
      return <img width="150px" src={`/thumbnail/${asset.Thumbnails[0]}`} alt={`Thumbnail for Tilemap ${asset.Name}`} />;
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
          <td><button type="button" className="btn btn-danger" onClick={this.onDeleteClicked(asset)}>Delete</button></td>
        </tr>
        )}
        {this.state.Spritesheets && this.state.Spritesheets.map(asset => <tr key={asset.Name}>
          <td>{asset.Name}</td>
          <td>{this.spritesheetThumbnail(asset)}</td>
          <td>{asset.CreatedAt}</td>
          <td><button type="button" className="btn btn-danger" onClick={this.onDeleteClicked(asset)}>Delete</button></td>
        </tr>
        )}
      </tbody>
    </table>;
  }
}