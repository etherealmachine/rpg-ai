import React from 'react';
import produce from 'immer';

import { Tileset, Tilemap, TilesetSource, references } from './Tiled';
import JSONRPCService from './JSONRPCService';
import SpritesheetSelector from './SpritesheetSelector';
import AssetService, { Spritesheet } from './AssetService';
import { isDefined } from './TypeHelpers';

interface State {
  assets: Asset[]
  Spritesheets: Spritesheet[]
  referenceMap: { [key: string]: number }
}

interface Asset {
  file: File
  loaded: boolean
  content?: Tilemap | Tileset | string
  error?: string
  missingReferences: string[]
}

export default class AssetUploader extends React.Component<{}, State> {

  fileInput: React.RefObject<HTMLInputElement> = React.createRef()
  formRef: React.RefObject<HTMLFormElement> = React.createRef()

  constructor(props: {}) {
    super(props);
    this.state = {
      assets: [],
      Spritesheets: [],
      referenceMap: {},
    };
  }

  componentDidMount() {
    AssetService.ListAssets({ OwnerID: (window as any).currentUserID }).then(resp => {
      this.setState(produce(this.state, state => {
        state.Spritesheets = resp.Spritesheets || [];
      }));
    });
  }

  onAssetLoad = (asset: Asset, event: ProgressEvent<FileReader>) => {
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
  }

  checkReferences(assets: Asset[], referenceMap: { [key: string]: number }): boolean {
    this.setState(produce(this.state, state => {
      const allRefs = references(assets.map(asset => asset.content).filter(isDefined));
      const filenames = new Set(assets.map(asset => asset.file.name));
      state.assets = assets.map(asset => {
        let missingReferences: string[] = [];
        let error = undefined;
        if (typeof asset.content === 'string') {
          if (!allRefs.has(asset.file.name)) {
            error = `image ${asset.file.name} is not referenced by any spritesheet or tilemap`;
          }
        } else if (typeof asset.content === 'object') {
          const refs = references([asset.content]);
          missingReferences = Array.from(refs.values()).filter(ref => !(filenames.has(ref) || referenceMap[ref]));
        }
        return {
          ...asset,
          error: error,
          missingReferences: missingReferences
        }
      });
      state.referenceMap = referenceMap;
    }));
    return assets.every(asset => !asset.error);
  }

  onUploadClicked = (event: React.MouseEvent) => {
    event.preventDefault();
    if (this.checkReferences(this.state.assets, this.state.referenceMap)) {
      const csrfInput = this.formRef.current?.querySelector('input[name="gorilla.csrf.Token"]');
      if (csrfInput && (csrfInput as HTMLInputElement).value === '') {
        JSONRPCService.csrfToken().then(token => {
          (csrfInput as HTMLInputElement).value = token;
          this.formRef.current?.submit();
        });
      }
    }
  }

  onFilesChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = (this.fileInput.current as any).files as FileList;
    const assets = [...files].map(file => { return { file: file, loaded: false, missingReferences: [] }; });
    Promise.all(assets.map(asset => new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (event: ProgressEvent<FileReader>) => {
        this.onAssetLoad(asset, event);
        resolve(asset);
      };
      fileReader.onerror = (err) => {
        reject(err);
      }
      if (asset.file.name.endsWith('.json')) {
        fileReader.readAsText(asset.file);
      } else if (asset.file.name.endsWith('.png') || asset.file.name.endsWith('.jpg') || asset.file.name.endsWith('.jpeg')) {
        fileReader.readAsDataURL(asset.file);
      } else {
        (asset as Asset).error = `cannot handle filetype of ${asset.file.name}`;
      }
    }))).then(() => {
      this.checkReferences(assets, {});
    });
  }

  onSpritesheetSelect = (filename: string) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newReferenceMap = produce(this.state.referenceMap, refs => {
      refs[filename] = parseInt(event.target.value);
    });
    this.checkReferences(this.state.assets, newReferenceMap);
  }

  render() {
    const tilemaps = this.state.assets.filter(asset => (typeof asset.content === 'object' && asset.content.type === 'map'));
    const tilesets = this.state.assets.filter(asset => (typeof asset.content === 'object' && asset.content.type === 'tileset'));
    const images = this.state.assets.filter(asset => typeof asset.content === 'string');
    const refs = references(this.state.assets.map(asset => asset.content).filter(isDefined));
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
        <input id="referenceMap" name="referenceMap" type="hidden" value={JSON.stringify(this.state.referenceMap)} />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={this.state.assets.length === 0}
          onClick={this.onUploadClicked}>
          Upload
        <input type="hidden" name="gorilla.csrf.Token" value=""></input>
        </button>
      </form>
      <div className="d-flex">
        {tilemaps.length > 0 && <div className="d-flex flex-column align-items-center mx-4">
          <h5>Tilemaps</h5>
          {tilemaps.map(asset => {
            return <div className="card" key={asset.file.name} style={{ width: '18rem' }}>
              <div className="card-body">
                <h5 className="card-title">{asset.file.name}</h5>
                {(asset.content as Tilemap).tilesets.map(tileset => {
                  if ((tileset as Tileset).image) {
                    return <div key={tileset.firstgid} className="card-text">
                      <i style={{ color: "#28a745" }} className="fa fa-check-square" />
                      <span>Embedded</span>
                    </div>;
                  } else if ((tileset as TilesetSource).source) {
                    const filename = (tileset as TilesetSource).source;
                    if (asset.missingReferences.includes(filename)) {
                      return <div key={tileset.firstgid} className="card-text form-inline d-flex justify-content-between my-3">
                        <label htmlFor={`${tileset.firstgid}-source-select`}>{filename}</label>
                        <SpritesheetSelector
                          id={`${tileset.firstgid}-source-select`}
                          Spritesheets={this.state.Spritesheets}
                          onSelection={this.onSpritesheetSelect(filename)}
                        />
                      </div>;
                    }
                    return <div key={tileset.firstgid} className="card-text">
                      {asset.error ?
                        <i className="fa fa-exclamation-circle" style={{ color: "#dc3545" }} /> :
                        <i style={{ color: "#28a745" }} className="fa fa-check-square" />
                      }
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
                  {asset.error ?
                    <i className="fa fa-exclamation-circle" style={{ color: "#dc3545" }} /> :
                    <i style={{ color: "#28a745" }} className="fa fa-check-square" />
                  }
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

export function SetImage(id: number, type: string, blob: Blob) {
  JSONRPCService.csrfToken().then(token => {
    const req = new XMLHttpRequest();
    req.open("POST", `/set-${type}-image`, true);
    const formData = new FormData();
    formData.append("id", `${id}`);
    formData.append("gorilla.csrf.Token", token);
    formData.append("image", blob);
    req.send(formData);
  });
}