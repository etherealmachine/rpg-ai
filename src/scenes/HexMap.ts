import Phaser from 'phaser';
import GameState from '../GameState';
import Tileset from '../Tileset';
import { Hex, OffsetCoord, Layout } from '../HexMath';

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

    const map: Map<string, number> = new Map();
    for (let q = 0; q < this.mapWidth; q++) {
      for (let r = 0; r < this.mapHeight; r++) {
        const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
        map.set(hex.toString(), water);
      }
    }

    const midQ = Math.floor(this.mapWidth / 2 + Phaser.Math.RND.integerInRange(-5, 5));
    const midR = Math.floor(this.mapHeight / 2 + Phaser.Math.RND.integerInRange(-5, 5));
    const seed = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(midQ, midR));
    map.set(seed.toString(), grass);
    const grassTiles = new Set([seed]);

    while (Array.from(grassTiles.keys()).length < 10) {
      const r = Phaser.Math.RND.pick(Array.from(grassTiles.keys()));
      const direction = Phaser.Math.RND.integerInRange(0, 5);
      const n = r.neighbor(direction);
      map.set(n.toString(), grass);
      grassTiles.add(n);
    }

    const layout = new Layout(Layout.flat, new Phaser.Math.Vector2(15, 15), new Phaser.Math.Vector2(0, 0));
    const curr = new Hex(0, 0, 0);
    /*
    while (map.has(curr.toString())) {
      const p = layout.hexToPixel(curr);
      this.add.sprite(p.x, p.y, 'hex_spritesheet', map.get(curr.toString()));
      curr = curr.neighbor()
    }
    */
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}