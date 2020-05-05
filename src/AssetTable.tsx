import React from 'react';

import AssetService, { ListAssetMetadataByOwnerIDRow } from './AssetService';

interface Props {
  Assets?: ListAssetMetadataByOwnerIDRow[]
}

interface State extends Props {

}

export default class AssetTable extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = props;
    if (!props.Assets) {
      AssetService.ListAssets({}).then(resp => {
        this.setState({
          Assets: resp.Assets,
        });
      });
    }
  }

  onDeleteClicked = (asset: ListAssetMetadataByOwnerIDRow) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    AssetService.DeleteAsset({ ID: asset.ID }).then(() => {
      AssetService.ListAssets({}).then(resp => {
        this.setState({
          Assets: resp.Assets,
        });
      });
    });
  }

  render() {
    return <table className="table">
      <thead>
        <tr>
          <th>Filename</th>
          <th>Content Type</th>
          <th>Size</th>
          <th>Uploaded At</th>
        </tr>
      </thead>
      <tbody>
        {this.state.Assets && this.state.Assets.map(asset => <tr key={asset.Filename}>
          <td>{asset.Filename}</td>
          <td>{asset.ContentType}</td>
          <td>{asset.Size} bytes</td>
          <td>{asset.CreatedAt}</td>
          <td><button type="button" className="btn btn-danger" onClick={this.onDeleteClicked(asset)}>Delete</button></td>
        </tr>
        )}
      </tbody>
    </table>;
  }
}