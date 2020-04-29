import Phaser from 'phaser';
import GameState from '../GameState';
import { Tileset } from '../Tiled';
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
    const mountain = tileset.tiles.findIndex(tile => tile.type === 'mountain');
    const hill = tileset.tiles.findIndex(tile => tile.type === 'hill');
    const hill_trees = tileset.tiles.findIndex(tile => tile.type === 'hill_trees');

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
    const grassTiles = new Set<string>([seed.toString()]);

    while (Array.from(grassTiles.keys()).length < 100) {
      const r = Phaser.Math.RND.pick(Array.from(grassTiles.keys()));
      const direction = Phaser.Math.RND.integerInRange(0, 5);
      const n = Hex.fromString(r).neighbor(direction);
      const coord = OffsetCoord.qoffsetFromCube(OffsetCoord.ODD, n);
      if (coord.col < 2 || coord.row === 2 || coord.col >= this.mapWidth - 2 || coord.row >= this.mapHeight - 2) continue;
      map.set(n.toString(), grass);
      grassTiles.add(n.toString());
    }

    const r = Phaser.Math.RND.pick(Array.from(grassTiles.keys()));
    map.set(r, mountain);
    const m = Hex.fromString(r);
    for (let n of m.ring(1)) {
      if (Math.random() < 0.2) continue;
      if (Math.random() < 0.5) {
        map.set(m.add(n).toString(), hill);
      } else {
        map.set(m.add(n).toString(), hill_trees);
      }
    }
    for (let n of m.ring(2)) {
      if (Math.random() < 0.6) continue;
      if (Math.random() < 0.5) {
        map.set(m.add(n).toString(), hill);
      } else {
        map.set(m.add(n).toString(), hill_trees);
      }
    }

    const layout = new Layout(Layout.flat, new Phaser.Math.Vector2(16, 16), new Phaser.Math.Vector2(0, 0));
    for (let r = 0; r < this.mapHeight; r++) {
      for (let q = this.mapWidth - 1; q >= 0; q--) {
        if (q % 2 === 0) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          this.add.sprite(p.x, p.y, 'hex_spritesheet', map.get(hex.toString()));
        }
      }
      for (let q = this.mapWidth - 1; q >= 0; q--) {
        if (q % 2 === 1) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          this.add.sprite(p.x, p.y, 'hex_spritesheet', map.get(hex.toString()));
        }
      }
    }
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}