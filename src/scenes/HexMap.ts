import Phaser from 'phaser';
import { Tilemap, TilesetSource } from '../Tiled';
import { OffsetCoord, Layout } from '../HexMath';

export default class HexMap extends Phaser.Scene {
  tiledMap?: Tilemap
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl

  init(args: any) {
    this.tiledMap = args.map;
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

    const tiledMap = this.tiledMap;
    if (!tiledMap) return;

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

    const sprites: Phaser.GameObjects.Sprite[] = [];
    const layout = new Layout(Layout.flat, new Phaser.Math.Vector2(16, 16.17), new Phaser.Math.Vector2(0, 0));
    for (let r = 0; r < tiledMap.height; r++) {
      for (let q = tiledMap.width - 1; q >= 0; q--) {
        if (q % 2 === 0) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          map.get(hex.toString())?.forEach(tile => {
            if (tile.index >= 0) {
              sprites.push(this.add.sprite(p.x, p.y, tile.spritesheet, tile.index));
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
              sprites.push(this.add.sprite(p.x, p.y, tile.spritesheet, tile.index));
            }
          });
        }
      }
    }
    const xMin = Math.min(...sprites.map(sprite => sprite.x));
    const xMax = Math.max(...sprites.map(sprite => sprite.x));
    const yMin = Math.min(...sprites.map(sprite => sprite.y));
    const yMax = Math.max(...sprites.map(sprite => sprite.y));
    const width = xMax - xMin;
    const height = yMax - yMin;
    this.cameras.main.centerOn(width / 2, height / 2);
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}