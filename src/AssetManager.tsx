import React from 'react';
import produce from 'immer';

import AssetService, { Spritesheet, FilledTilemap } from './AssetService';

interface State {
  Tilemaps: FilledTilemap[]
  Spritesheets: Spritesheet[]
  editing: { [key: string]: boolean }
}

export default class AssetManager extends React.Component<State, State> {

  fileInputRefs: { [key: string]: React.RefObject<HTMLInputElement> } = {}

  constructor(props: State) {
    super(props);
    this.state = {
      ...props,
      editing: {},
    };
    if (!props.Tilemaps || !props.Spritesheets) {
      this.updateAssets();
    } else {
      props.Tilemaps.forEach(tilemap => {
        this.fileInputRefs[tilemap.Hash] = React.createRef();
      });
    }
  }

  updateAssets() {
    AssetService.ListAssets({}).then(resp => {
      (resp.Tilemaps || []).forEach(tilemap => {
        this.fileInputRefs[tilemap.Hash] = React.createRef();
      });
      this.setState(produce(this.state, state => {
        state.Tilemaps = resp.Tilemaps || [];
        state.Spritesheets = resp.Spritesheets || [];
      }));
    });
  }

  onEditSpritesheetClicked = (spritesheet: Spritesheet) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[spritesheet.Hash] = !state.editing[spritesheet.Hash];
    }));
  }

  onDeleteSpritesheetClicked = (spritesheet: Spritesheet) => (event: React.MouseEvent<HTMLButtonElement>) => {
    AssetService.DeleteSpritesheet({ ID: spritesheet.ID }).then(() => {
      this.updateAssets();
    });
  }

  onEditTilemapClicked = (tilemap: FilledTilemap) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[tilemap.Hash] = !state.editing[tilemap.Hash];
    }));
  }

  onDeleteTilemapClicked = (tilemap: FilledTilemap) => (event: React.MouseEvent<HTMLButtonElement>) => {
    AssetService.DeleteTilemap({ ID: tilemap.ID }).then(() => {
      this.updateAssets();
    });
  }

  onSaveTilemapClicked = (tilemap: FilledTilemap) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const fileInput = this.fileInputRefs[tilemap.Hash].current;
    if (!fileInput || !fileInput.files) return;
    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      if (typeof ev.target?.result === 'string') {
        AssetService.UpdateTilemap({ ID: tilemap.ID, OwnerID: -1, Name: tilemap.Name, Description: { String: "", Valid: false }, Definition: JSON.parse(ev.target.result) }).then(() => {
          this.updateAssets();
        });
      }
    }
    reader.readAsText(fileInput.files[0]);
  }

  tilemapThumbnail(asset: FilledTilemap) {
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
    (window as any).AssetManager = this;
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
          <td>
            <div className="d-flex flex-column">
              {this.state.editing[asset.Hash] ?
                <React.Fragment>
                  <button type="button" className="btn btn-warning mb-4" onClick={this.onEditTilemapClicked(asset)}>Cancel</button>
                  <div className="d-flex">
                    <input type="file" name={`file-input-${asset.ID}`} ref={this.fileInputRefs[asset.Hash]} />
                    <button type="button" className="btn btn-primary mb-4" onClick={this.onSaveTilemapClicked(asset)}>Save</button>
                  </div>
                  <a className="btn btn-primary mt-4" href={`/tilemap/download/${asset.Hash}`}>Download</a>
                  <button type="button" className="btn btn-danger mt-4" onClick={this.onDeleteTilemapClicked(asset)}>Delete</button>
                </React.Fragment> :
                <React.Fragment>
                  <button type="button" className="btn btn-secondary mb-4" onClick={this.onEditTilemapClicked(asset)}>Edit</button>
                </React.Fragment>
              }
            </div>
          </td>
        </tr>
        )}
        {this.state.Spritesheets && this.state.Spritesheets.map(asset => <tr key={asset.Name}>
          <td>{asset.Name}</td>
          <td>{this.spritesheetThumbnail(asset)}</td>
          <td>{asset.CreatedAt}</td>
          <td>
            <div className="d-flex flex-column">
              {this.state.editing[asset.Hash] ?
                <React.Fragment>
                  <button type="button" className="btn btn-warning mb-4" onClick={this.onEditSpritesheetClicked(asset)}>Cancel</button>
                  <a className="btn btn-primary mt-4" href={`/spritesheet/download/definition/${asset.Hash}`}>Download Definition</a>
                  <a className="btn btn-primary mt-4" href={`/spritesheet/download/image/${asset.Hash}`}>Download Image</a>
                  <button type="button" className="btn btn-danger mt-4" onClick={this.onDeleteSpritesheetClicked(asset)}>Delete</button>
                </React.Fragment> :
                <React.Fragment>
                  <button type="button" className="btn btn-secondary mb-4" onClick={this.onEditSpritesheetClicked(asset)}>Edit</button>
                </React.Fragment>
              }
            </div>
          </td>
        </tr>
        )}
      </tbody>
    </table>;
  }
}