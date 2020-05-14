import Phaser from 'phaser';
import { Tilemap, TilesetSource } from '../Tiled';
import { OffsetCoord, Layout } from '../HexMath';
import { Tilemap as TilemapModel } from '../AssetService';
import { SetTilemapThumbnail } from '../AssetUploader';

export default class HexMap extends Phaser.Scene {
  tilemapModel!: TilemapModel
  tiledMap!: Tilemap
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl
  sprites: Phaser.GameObjects.Sprite[] = []

  init(args: any) {
    this.tilemapModel = args.tilemapModel;
    this.tiledMap = args.map;
  }

  generateThumbnail() {
    const minX = Math.min(...this.sprites.map(sprite => sprite.x));
    const maxX = Math.max(...this.sprites.map(sprite => sprite.x));
    const minY = Math.min(...this.sprites.map(sprite => sprite.y));
    const maxY = Math.max(...this.sprites.map(sprite => sprite.y));
    this.cameras.main.setZoom(1);
    let width = maxX - minX;
    let height = maxY - minY;
    this.cameras.main.centerOn(width / 2, height / 2);
    width = Math.ceil(width) + 2 * this.tiledMap.tilewidth;
    height = Math.ceil(height) + 2 * this.tiledMap.tileheight;

    this.game.renderer.snapshotArea(
      (this.game.canvas.width - width) / 2, (this.game.canvas.height - height) / 2,
      width, height,
      image => {
        const c = document.createElement("canvas");
        c.setAttribute("width", `${width}px`);
        c.setAttribute("height", `${height}px`);
        c.getContext("2d")?.drawImage(image as HTMLImageElement, 0, 0);
        (c as HTMLCanvasElement).toBlob(blob => {
          if (!blob) return;
          if (this.tilemapModel) SetTilemapThumbnail(this.tilemapModel.ID, blob);
        });
      })
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
    this.cameras.main.setBackgroundColor('#ddd');
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.P:
          this.generateThumbnail();
      }
    });

    const map: Map<string, { index: number, spritesheet: string }[]> = new Map();

    for (let q = 0; q < this.tiledMap.width; q++) {
      for (let r = 0; r < this.tiledMap.height; r++) {
        const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
        map.set(hex.toString(), this.tiledMap.layers.map(layer => {
          return {
            index: layer.data[r * this.tiledMap.width + q] - 1,
            spritesheet: (this.tiledMap.tilesets[0] as TilesetSource).source,
          };
        }));
      }
    }

    this.sprites = [];
    const layout = new Layout(Layout.flat, new Phaser.Math.Vector2(16, 16.17), new Phaser.Math.Vector2(0, 0));
    for (let r = 0; r < this.tiledMap.height; r++) {
      for (let q = this.tiledMap.width - 1; q >= 0; q--) {
        if (q % 2 === 0) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          map.get(hex.toString())?.forEach(tile => {
            if (tile.index >= 0) {
              this.sprites.push(this.add.sprite(p.x, p.y, tile.spritesheet, tile.index));
            }
          });
        }
      }
      for (let q = this.tiledMap.width - 1; q >= 0; q--) {
        if (q % 2 === 1) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          map.get(hex.toString())?.forEach(tile => {
            if (tile.index >= 0) {
              this.sprites.push(this.add.sprite(p.x, p.y, tile.spritesheet, tile.index));
            }
          });
        }
      }
    }
    const xMin = Math.min(...this.sprites.map(sprite => sprite.x));
    const xMax = Math.max(...this.sprites.map(sprite => sprite.x));
    const yMin = Math.min(...this.sprites.map(sprite => sprite.y));
    const yMax = Math.max(...this.sprites.map(sprite => sprite.y));
    const width = xMax - xMin;
    const height = yMax - yMin;
    this.cameras.main.centerOn(width / 2, height / 2);
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}