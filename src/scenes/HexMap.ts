import Phaser from 'phaser';
import GameState from '../GameState';
import Tileset from '../Tileset';
import { Hex, Layout } from '../HexMath';

class TiledHex extends Hex {

  tileIndex: number

  constructor(x: number, y: number, tileIndex: number) {
    super(x, y, -x - y);
    this.tileIndex = tileIndex;
  }
}

export default class HexMap extends Phaser.Scene {
  state?: GameState
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl
  mapWidth = 20
  mapHeight = 20

  init(args: any) {
    this.state = args.game;
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
    this.cameras.main.setScroll(-40, -40);

    const tileset = this.cache.json.get('hex_tileset') as Tileset;

    const water = tileset.tiles.findIndex(tile => tile.type === 'water');
    const grass = tileset.tiles.findIndex(tile => tile.type === 'grass');

    const map: Map<number, Map<number, TiledHex>> = new Map();
    for (let x = 0; x < this.mapWidth; x++) {
      map.set(x, new Map());
      for (let y = 0; y < this.mapHeight; y++) {
        y -= x / 2;
        if (y === 0) {
          map.get(x)?.set(y, new TiledHex(x, y, grass));
        } else {
          map.get(x)?.set(y, new TiledHex(x, y, water));
        }
      }
    }

    /*
    const seedX = Math.floor(this.mapWidth / 2 + Phaser.Math.RND.integerInRange(-5, 5));
    const seedY = Math.floor(this.mapHeight / 2 + Phaser.Math.RND.integerInRange(-5, 5));
    const seedIndex = seedY * this.mapWidth + seedX;

    map[seedIndex] = grass;
    const grassTiles = new Set([seedIndex]);

    while (Array.from(grassTiles.keys()).length < 100) {
      let j = Phaser.Math.RND.pick(Array.from(grassTiles.keys()));
      let x = j % this.mapHeight;
      let y = Math.floor(j / this.mapWidth);
      const r = Phaser.Math.RND.frac();
      if (r < 0.05) {
        x++;
      } else if (r < 0.1) {
        x--;
      } else if (r < 0.45) {
        y++;
      } else {
        y--;
      }
      x = Phaser.Math.Clamp(x, 1, this.mapWidth - 2);
      y = Phaser.Math.Clamp(y, 1, this.mapHeight - 2);
      j = y * this.mapWidth + x;
      map[j] = grass;
      grassTiles.add(j);
    }
    */

    const layout = new Layout(Layout.flat, new Phaser.Math.Vector2(16, 15), new Phaser.Math.Vector2(0, 0));
    for (let col of map.values()) {
      for (let hex of col.values()) {
        const p = layout.hexToPixel(hex);
        this.add.sprite(p.x, p.y, 'hex_spritesheet', hex.tileIndex);
      }
    }
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}