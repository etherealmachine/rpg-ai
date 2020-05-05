import React from 'react';

import AssetService, { ListAssetsResponse, ListTilemapsByOwnerIDRow, ListSpritesheetsByOwnerIDRow } from './AssetService';

export default class AssetTable extends React.Component<ListAssetsResponse, ListAssetsResponse> {

  constructor(props: ListAssetsResponse) {
    super(props);
    this.state = props;
    if (!props.Tilemaps || !props.Spritesheets) {
      AssetService.ListAssets({}).then(resp => {
        this.setState(resp);
      });
    }
  }

  onDeleteClicked = (asset: ListTilemapsByOwnerIDRow | ListSpritesheetsByOwnerIDRow) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if ((asset as ListSpritesheetsByOwnerIDRow).SpritesheetSize) {
      AssetService.DeleteSpritesheet({ ID: asset.ID }).then(() => {
        AssetService.ListAssets({}).then(resp => {
          this.setState(resp);
        });
      });
    } else {
      AssetService.DeleteTilemap({ ID: asset.ID }).then(() => {
        AssetService.ListAssets({}).then(resp => {
          this.setState(resp);
        });
      });
    }
  }

  render() {
    return <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Uploaded At</th>
        </tr>
      </thead>
      <tbody>
        {this.state.Tilemaps && this.state.Tilemaps.map(asset => <tr key={asset.Name}>
          <td><a href={`/?map=${asset.ID}`}>{asset.Name}</a></td>
          <td>{asset.CreatedAt}</td>
          <td><button type="button" className="btn btn-danger" onClick={this.onDeleteClicked(asset)}>Delete</button></td>
        </tr>
        )}
        {this.state.Spritesheets && this.state.Spritesheets.map(asset => <tr key={asset.Name}>
          <td>{asset.Name}</td>
          <td>{asset.CreatedAt}</td>
          <td><button type="button" className="btn btn-danger" onClick={this.onDeleteClicked(asset)}>Delete</button></td>
        </tr>
        )}
      </tbody>
    </table>;
  }
}