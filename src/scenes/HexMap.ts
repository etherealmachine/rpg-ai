import Phaser from 'phaser';
import { Tilemap, TilesetSource } from '../Tiled';
import { OffsetCoord, Layout } from '../HexMath';

export default class HexMap extends Phaser.Scene {
  mapName?: string
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl

  init(args: any) {
    this.mapName = args.mapName;
  }

  create() {
    const cursors = this.input.keyboard.createCursorKeys();
    const controlConfig = {
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      acceleration: 0.5,
      drag: 0.01,
      maxSpeed: 2.0,
      zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };
    this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);
    this.cameras.main.setBackgroundColor('#fff');

    if (!this.mapName) return;
    const tiledMap = this.cache.json.get(this.mapName) as Tilemap;

    const map: Map<string, { index: number, spritesheet: string }[]> = new Map();

    for (let q = 0; q < tiledMap.width; q++) {
      for (let r = 0; r < tiledMap.height; r++) {
        const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
        map.set(hex.toString(), tiledMap.layers.map(layer => {
          return {
            index: layer.data[r * tiledMap.width + q] - 1,
            spritesheet: (tiledMap.tilesets[0] as TilesetSource).source,
          };
        }));
      }
    }

    const layout = new Layout(Layout.flat, new Phaser.Math.Vector2(16, 16.17), new Phaser.Math.Vector2(0, 0));
    for (let r = 0; r < tiledMap.height; r++) {
      for (let q = tiledMap.width - 1; q >= 0; q--) {
        if (q % 2 === 0) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          map.get(hex.toString())?.forEach(tile => {
            if (tile.index >= 0) {
              this.add.sprite(p.x, p.y, tile.spritesheet, tile.index);
            }
          });
        }
      }
      for (let q = tiledMap.width - 1; q >= 0; q--) {
        if (q % 2 === 1) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          map.get(hex.toString())?.forEach(tile => {
            if (tile.index >= 0) {
              this.add.sprite(p.x, p.y, tile.spritesheet, tile.index);
            }
          });
        }
      }
    }
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}