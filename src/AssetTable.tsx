import React from 'react';
import produce from 'immer';

import AssetService, { Spritesheet, TilemapWithThumbnails } from './AssetService';
import { references } from './Tiled';

interface State {
  Tilemaps: TilemapWithThumbnails[]
  Spritesheets: Spritesheet[]
  editing: { [key: string]: boolean }
}

export default class AssetTable extends React.Component<State, State> {

  constructor(props: State) {
    super(props);
    this.state = {
      ...props,
      editing: {},
    };
    if (!props.Tilemaps || !props.Spritesheets) {
      AssetService.ListAssets({}).then(resp => {
        this.setState(produce(this.state, state => {
          state.Tilemaps = resp.Tilemaps || [];
          state.Spritesheets = resp.Spritesheets || [];
        }));
      });
    }
  }

  onEditSpritesheetClicked = (spritesheet: Spritesheet) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[spritesheet.Hash] = !state.editing[spritesheet.Hash];
    }));
  }

  onDeleteSpritesheetClicked = (spritesheet: Spritesheet) => (event: React.MouseEvent<HTMLButtonElement>) => {
    AssetService.DeleteSpritesheet({ ID: spritesheet.ID }).then(() => {
      AssetService.ListAssets({}).then(resp => {
        this.setState(produce(this.state, state => {
          state.Tilemaps = resp.Tilemaps || [];
          state.Spritesheets = resp.Spritesheets || [];
        }));
      });
    });
  }

  onEditTilemapClicked = (tilemap: TilemapWithThumbnails) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[tilemap.Hash] = !state.editing[tilemap.Hash];
    }));
  }

  onDeleteTilemapClicked = (tilemap: TilemapWithThumbnails) => (event: React.MouseEvent<HTMLButtonElement>) => {
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
          <th>References</th>
        </tr>
      </thead>
      <tbody>
        {this.state.Tilemaps && this.state.Tilemaps.map(asset => <tr key={asset.Name}>
          <td><a href={`/map/${asset.Hash}`}>{asset.Name}</a></td>
          <td>{this.tilemapThumbnail(asset)}</td>
          <td>{asset.CreatedAt}</td>
          <td>
            {asset.Definition && references([JSON.parse(asset.Definition)])}
          </td>
          <td>
            <div className="d-flex flex-column">
              {this.state.editing[asset.Hash] ?
                <button type="button" className="btn btn-warning mb-4" onClick={this.onEditTilemapClicked(asset)}>Cancel</button> :
                <button type="button" className="btn btn-secondary mb-4" onClick={this.onEditTilemapClicked(asset)}>Edit</button>
              }
              <button type="button" className="btn btn-danger mt-4" onClick={this.onDeleteTilemapClicked(asset)}>Delete</button>
            </div>
          </td>
        </tr>
        )}
        {this.state.Spritesheets && this.state.Spritesheets.map(asset => <tr key={asset.Name}>
          <td>{asset.Name}</td>
          <td>{this.spritesheetThumbnail(asset)}</td>
          <td>{asset.CreatedAt}</td>
          <td></td>
          <td>
            <div className="d-flex flex-column">
              {this.state.editing[asset.Hash] ?
                <button type="button" className="btn btn-warning mb-4" onClick={this.onEditSpritesheetClicked(asset)}>Cancel</button> :
                <button type="button" className="btn btn-secondary mb-4" onClick={this.onEditSpritesheetClicked(asset)}>Edit</button>
              }
              <button type="button" className="btn btn-danger mt-4" onClick={this.onDeleteSpritesheetClicked(asset)}>Delete</button>
            </div>
          </td>
        </tr>
        )}
      </tbody>
    </table>;
  }
}