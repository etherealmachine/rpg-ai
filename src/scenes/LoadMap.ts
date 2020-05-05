import Phaser from 'phaser';
import { host } from '../JSONRPCService';
import AssetService from '../AssetService';
import { Tileset } from '../Tiled';

export default class LoadMap extends Phaser.Scene {
  mapID?: number
  mapName?: string

  init(args: any) {
    this.mapID = parseInt(args.mapID);
  }

  /*
  preload() {
    if (this.mapID) {
      this.fetchAsset(this.mapID, -1);
    }
  }

  fetchAsset(id: number, parentID: number) {
    const req = new XMLHttpRequest();
    req.withCredentials = true;
    req.open('GET', `${host}/assets/${id}`, true);
    req.responseType = 'blob';
    req.onreadystatechange = () => {
      if (req.readyState === 4 && req.status === 200) {
        const filename = req.getResponseHeader('x-filename');
        if (filename) {
          const contentType = req.getResponseHeader('content-type');
          switch (contentType) {
            case 'application/json':
              const r = new FileReader();
              r.onload = () => {
                if (!r.result) return;
                const obj = JSON.parse(r.result as string);
                obj['filename'] = filename;
                this.cache.json.add(filename, obj);
                if (id === this.mapID) {
                  this.mapName = filename;
                }
              }
              r.readAsText(req.response);
              break;
            case 'image/png':
            case 'image/jpeg':
              const image = new Image();
              image.onload = () => {
                const tileset = this.cache.json.get(`${parentID}`) as Tileset;
                const config = {
                  frameWidth: tileset.tilewidth,
                  frameHeight: tileset.tileheight,
                  margin: tileset.margin,
                  spacing: tileset.spacing,
                };
                this.textures.addSpriteSheet((tileset as any).filename, image, config);
                this.game.scene.start('HexMap', { mapName: this.mapName });
              };
              image.src = URL.createObjectURL(req.response);
              break;
          }
        }
      }
    };
    req.send();
    AssetService.ListReferences({ ID: id }).then(resp => {
      resp.References?.forEach(ref => this.fetchAsset(ref.ReferencedAssetID, id));
    });
  }
  */
}