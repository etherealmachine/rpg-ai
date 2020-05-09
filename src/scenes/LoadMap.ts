import Phaser from 'phaser';
import { host } from '../JSONRPCService';
import AssetService, { Tilemap as TilemapModel } from '../AssetService';
import { Tilemap, Tileset } from '../Tiled';

export default class LoadMap extends Phaser.Scene {
  mapModel?: TilemapModel
  map?: Tilemap

  init(args: any) {
    this.mapModel = args.map;
  }

  preload() {
    if (this.mapModel) {
      this.loadTilemap().then(() => {
        if (this.map && this.map.orientation === 'orthogonal') {
          this.game.scene.start('OrthoMap', { tilemapModel: this.mapModel, map: this.map });
        } else {
          this.game.scene.start('HexMap', { tilemapModel: this.mapModel, map: this.map });
        }
      });
    }
  }

  async loadTilemap() {
    if (!this.mapModel) return;
    this.map = ((this.mapModel?.Definition as unknown) as Tilemap);
    const refs = (await AssetService.ListReferences({ TilemapID: this.mapModel.ID })).References;
    await Promise.all((refs || []).map(async ref => {
      let req = await this.fetch(`${host}/spritesheet/definition/${ref.SpritesheetHash}`, 'text');
      const tileset = JSON.parse(req.responseText) as Tileset;
      this.cache.json.add(ref.SpritesheetName, tileset);
      req = await this.fetch(`${host}/spritesheet/image/${ref.SpritesheetHash}`, 'blob');
      return this.loadSpriteSheet(ref.SpritesheetName, tileset, req.response as Blob);
    }));
  }

  async fetch(url: string, responseType: XMLHttpRequestResponseType): Promise<XMLHttpRequest> {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.withCredentials = true;
      req.open('GET', url, true);
      req.responseType = responseType;
      req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {
          resolve(req);
        } else if (req.status !== 200) {
          reject(req);
        }
      }
      req.send();
    });
  }

  async loadSpriteSheet(name: string, tileset: Tileset, blob: Blob): Promise<Phaser.Textures.Texture> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const config = {
          frameWidth: tileset.tilewidth,
          frameHeight: tileset.tileheight,
          margin: tileset.margin,
          spacing: tileset.spacing,
        };
        resolve(this.textures.addSpriteSheet(name, image, config));
      };
      image.onerror = err => {
        reject(err);
      };
      image.src = URL.createObjectURL(blob);
    });
  }
}