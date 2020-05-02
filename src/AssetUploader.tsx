import React from 'react';
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'

import { Tileset, Tilemap } from './Tiled';
import AssetService from './AssetService';

const api = new AssetService(window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

interface State {
  assets: Asset[]
}

interface Asset {
  file: File
  loaded: boolean
  tilemap?: Tilemap
  tileset?: Tileset
  image?: string
  error?: string
}

export default class AssetUploader extends React.Component<{}, State> {

  fileInput: React.RefObject<HTMLInputElement> = React.createRef()

  constructor(props: {}) {
    super(props);
    this.state = {
      assets: [],
    };
  }

  onAssetLoad = (asset: Asset) => (event: ProgressEvent<FileReader>) => {
    const buf = event.target?.result;
    if (buf) {
      if (asset.file.name.endsWith('.json')) {
        let obj: any;
        try {
          obj = JSON.parse(buf as string);
          if (obj.hasOwnProperty('type') && obj.type === 'tileset') {
            asset.tileset = obj as Tileset;
          } else if (obj.hasOwnProperty('type') && obj.type === 'map') {
            asset.tilemap = obj as Tilemap;
          } else if (obj.hasOwnProperty('type')) {
            asset.error = `unknown object type ${obj.type}`;
          } else {
            asset.error = `json object has not type attribute`;
          }
        } catch (e) {
          asset.error = "JSON parse error";
        }
      } else if (asset.file.name.endsWith('.png') || asset.file.name.endsWith('.jpg') || asset.file.name.endsWith('.jpeg')) {
        asset.image = buf as string;
      }
    }
    this.setState({
      ...this.state,
    });
  }

  onUploadClicked = (event: React.MouseEvent) => {
    event.preventDefault();
  }

  onFilesChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = (this.fileInput.current as any).files as FileList;
    const assets = [...files].map(file => { return { file: file, loaded: false }; });
    assets.forEach((asset, i) => {
      const fileReader = new FileReader();
      fileReader.onload = this.onAssetLoad(asset as Asset);
      if (asset.file.name.endsWith('.json')) {
        fileReader.readAsText(asset.file);
      } else if (asset.file.name.endsWith('.png') || asset.file.name.endsWith('.jpg') || asset.file.name.endsWith('.jpeg')) {
        fileReader.readAsDataURL(asset.file);
      } else {
        (asset as Asset).error = `cannot handle filetype of ${asset.file.name}`;
      }
    });
    this.setState({
      assets: assets,
    });
  }

  render() {
    return <div>
      <form>
        <input
          type="file"
          id="files"
          name="files[]"
          ref={this.fileInput}
          onChange={this.onFilesChanged}
          multiple />
        <Button variant="primary" onClick={this.onUploadClicked}>Upload</Button>
      </form>
      <div>{this.state.assets.map((asset, i) => {
        return <Card key={i} style={{ width: '18rem' }}>
          {asset.image && <Card.Img variant="top" src={asset.image} />}
          <Card.Body>
            {asset.tilemap && <Card.Title>Tilemap</Card.Title>}
            {asset.tileset && <Card.Title>Tileset</Card.Title>}
            {asset.image && <Card.Title>Image</Card.Title>}
            <Card.Text>{asset.file.name}</Card.Text>
          </Card.Body>
        </Card>;
      })}
      </div>
    </div>;
  }
}