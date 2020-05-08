import React from 'react';

import AssetService, { ListTilemapsByOwnerIDRow, ListSpritesheetsByOwnerIDRow } from './AssetService';

interface State {
  Tilemaps: ListTilemapsByOwnerIDRow[]
  Spritesheets: ListSpritesheetsByOwnerIDRow[]
  TilemapThumbnails?: { [key: number]: number[] | null }
  SpritesheetThumbnails?: { [key: number]: number[] | null }
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
        this.loadThumbnails(state);
      });
    } else {
      this.loadThumbnails(props);
    }
  }

  loadThumbnails(state: State) {
    AssetService.ListThumbnails({
      TilemapIDs: state.Tilemaps.map(tilemap => tilemap.ID),
      SpritesheetIDs: state.Spritesheets.map(spritesheet => spritesheet.ID),
    }).then(thumbnails => {
      this.setState({
        ...this.state,
        TilemapThumbnails: thumbnails.TilemapThumbnailIDs || [],
        SpritesheetThumbnails: thumbnails.SpritesheetThumbnailIDs || [],
      })
    });
  }

  onDeleteClicked = (asset: ListTilemapsByOwnerIDRow | ListSpritesheetsByOwnerIDRow) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if ((asset as ListSpritesheetsByOwnerIDRow).SpritesheetSize) {
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

  tilemapThumbnail(asset: ListTilemapsByOwnerIDRow) {
    const m = this.state.TilemapThumbnails;
    if (!m) return;
    const t = m[asset.ID];
    if (t && t.length > 0) {
      return <img width="150px" src={`/thumbnail/${t[0]}`} alt={`Thumbnail for Tilemap ${asset.Name}`} />;
    }
    return null;
  }

  spritesheetThumbnail(asset: ListSpritesheetsByOwnerIDRow) {
    return <img width="150px" src={`/spritesheet/image/${asset.ID}`} alt={`Thumbnail for Spritesheet ${asset.Name}`} />;
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
          <td><a href={`/map/${asset.ID}`}>{asset.Name}</a></td>
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