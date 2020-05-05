import React from 'react';

import { Tileset, Tilemap, TilesetSource } from './Tiled';
import JSONRPCService from './JSONRPCService';

interface State {
  assets: Asset[]
  everyReferenceExists: boolean
  everyImageIsReferenced: boolean
}

interface Asset {
  file: File
  loaded: boolean
  content?: Tilemap | Tileset | string
  error?: string
}

function hasFile(assets: Asset[], filename: string): boolean {
  return assets.some(asset => asset.file.name === filename);
}

function fileIndicator(assets: Asset[], filename: string) {
  if (hasFile(assets, filename)) {
    return <i style={{ color: "#28a745" }} className="fa fa-check-square" />;
  }
  return <i className="fa fa-exclamation-circle" style={{ color: "#dc3545" }} />;
}

function references(assets: Asset[]) {
  return new Set(assets.map(asset => {
    if (typeof asset.content === 'object' && asset.content.type === 'map') {
      return (asset.content as Tilemap).tilesets.map(tileset => {
        if ((tileset as Tileset).image) {
          return (tileset as Tileset).image;
        } else if ((tileset as TilesetSource).source) {
          return (tileset as TilesetSource).source;
        }
        return null;
      });
    } else if (typeof asset.content === 'object' && asset.content.type === 'tileset') {
      return (asset.content as Tileset).image;
    }
    return null;
  }).flat().filter(ref => ref));
}

export default class AssetUploader extends React.Component<{}, State> {

  fileInput: React.RefObject<HTMLInputElement> = React.createRef()
  formRef: React.RefObject<HTMLFormElement> = React.createRef()

  constructor(props: {}) {
    super(props);
    this.state = {
      assets: [],
      everyReferenceExists: true,
      everyImageIsReferenced: true,
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
            asset.content = obj;
          } else if (obj.hasOwnProperty('type') && obj.type === 'map') {
            asset.content = obj;
          } else if (obj.hasOwnProperty('type')) {
            asset.error = `unknown object type ${obj.type}`;
          } else {
            asset.error = `json object has not type attribute`;
          }
        } catch (e) {
          asset.error = "JSON parse error";
        }
      } else if (asset.file.name.endsWith('.png') || asset.file.name.endsWith('.jpg') || asset.file.name.endsWith('.jpeg')) {
        asset.content = buf as string;
      }
    }
    this.setState({
      ...this.state,
    });
  }

  checkReferences() {
    const images = this.state.assets.filter(asset => typeof asset.content === 'string');
    const filenames = new Set(this.state.assets.map(asset => asset.file.name));
    const refs = references(this.state.assets);
    const everyReferenceExists = Array.from(refs.values()).every(ref => filenames.has(ref));
    const everyImageIsReferenced = images.every(asset => refs.has(asset.file.name));
    this.setState({
      ...this.state,
      everyReferenceExists: everyReferenceExists,
      everyImageIsReferenced: everyImageIsReferenced,
    });
    return everyReferenceExists && everyImageIsReferenced;
  }

  onUploadClicked = (event: React.MouseEvent) => {
    event.preventDefault();
    if (this.checkReferences()) {
      const csrfInput = this.formRef.current?.querySelector('input[name="gorilla.csrf.Token"]');
      console.log(csrfInput);
      if (csrfInput && (csrfInput as HTMLInputElement).value === '') {
        JSONRPCService.csrfToken().then(token => {
          (csrfInput as HTMLInputElement).value = token;
          console.log(token);
          this.formRef.current?.submit();
        });
      }
    }
  }

  onFilesChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = (this.fileInput.current as any).files as FileList;
    const assets = [...files].map(file => { return { file: file, loaded: false }; });
    assets.forEach(asset => {
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
    this.checkReferences();
    this.setState({
      ...this.state,
      assets: assets,
    });
  }

  render() {
    const tilemaps = this.state.assets.filter(asset => (typeof asset.content === 'object' && asset.content.type === 'map'));
    const tilesets = this.state.assets.filter(asset => (typeof asset.content === 'object' && asset.content.type === 'tileset'));
    const images = this.state.assets.filter(asset => typeof asset.content === 'string');
    const refs = references(this.state.assets);
    const host = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
    return <div>
      <form action={`${host}/upload-assets?redirect=${window.location}`} method="POST" encType="multipart/form-data" ref={this.formRef}>
        <input
          type="file"
          id="files"
          name="files[]"
          ref={this.fileInput}
          onChange={this.onFilesChanged}
          multiple />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={this.state.assets.length === 0}
          onClick={this.onUploadClicked}>
          Upload
        <input type="hidden" name="gorilla.csrf.Token" value=""></input>
        </button>
      </form>
      {!this.state.everyReferenceExists && <div className="alert alert-danger" role="alert">
        Some assets are missing a reference.
      </div>}
      {!this.state.everyImageIsReferenced && <div className="alert alert-danger" role="alert">
        Images exist but don't have a tileset. Either remove the image or upload a tileset definition.
      </div>}
      <div className="d-flex">
        {tilemaps.length > 0 && <div className="d-flex flex-column align-items-center mx-4">
          <h5>Tilemaps</h5>
          {tilemaps.map(asset => {
            return <div className="card" key={asset.file.name} style={{ width: '18rem' }}>
              <div className="card-body">
                <h5 className="card-title">{asset.file.name}</h5>
                {(asset.content as Tilemap).tilesets.map(tileset => {
                  if ((tileset as Tileset).image) {
                    const filename = (tileset as Tileset).image;
                    return <div key={tileset.firstgid} className="card-text">
                      {fileIndicator(this.state.assets, filename)}
                    </div>;
                  } else if ((tileset as TilesetSource).source) {
                    const filename = (tileset as TilesetSource).source;
                    return <div key={tileset.firstgid} className="card-text">
                      {fileIndicator(this.state.assets, filename)}
                      {filename}
                    </div>;
                  }
                  return null;
                })}
              </div>
            </div>;
          })}
        </div>}
        {tilesets.length > 0 && <div className="d-flex flex-column align-items-center mx-4">
          <h5>Tilesets</h5>
          {tilesets.map(asset => {
            return <div className="card" key={asset.file.name} style={{ width: '18rem' }}>
              <div className="card-body">
                <h5 className="card-title">{asset.file.name}</h5>
                <div className="card-text">
                  {fileIndicator(this.state.assets, (asset.content as Tileset).image || '')}
                  {(asset.content as Tileset).image}
                </div>
              </div>
            </div>;
          })}
        </div>}
        {images.length > 0 && <div className="d-flex flex-column align-items-center mx-4">
          <h5>Images</h5>
          {images.map(asset => {
            return <div className="card" key={asset.file.name} style={{ width: '18rem' }}>
              <img src={asset.content as string} className="card-img-top" alt={asset.file.name} />
              <div className="card-body">
                <h5 className="card-title">{asset.file.name}</h5>
                {!refs.has(asset.file.name) && <i className="fa fa-unlink" style={{ color: "#dc3545" }} />}
              </div>
            </div>;
          })}
        </div>}
      </div>
    </div>;
  }
}