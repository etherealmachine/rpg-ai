import Phaser from 'phaser';
import GameState from '../GameState';
import { OffsetCoord, Layout } from '../HexMath';

export default class HexMap extends Phaser.Scene {
  state?: GameState
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl

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

    const tiledMap = this.add.tilemap("example_hexmap");
    const columns = tiledMap.width * 2;
    const rows = tiledMap.height * 2;

    const map: Map<string, number[]> = new Map();
    for (let q = 0; q < columns; q++) {
      for (let r = 0; r < rows; r++) {
        const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
        map.set(hex.toString(), [-1]);
      }
    }

    const layout = new Layout(Layout.flat, new Phaser.Math.Vector2(16, 16), new Phaser.Math.Vector2(0, 0));
    for (let r = 0; r < rows; r++) {
      for (let q = columns - 1; q >= 0; q--) {
        if (q % 2 === 0) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          map.get(hex.toString())?.forEach(tileIndex => {
            this.add.sprite(p.x, p.y, 'hex_spritesheet');
          });
        }
      }
      for (let q = columns - 1; q >= 0; q--) {
        if (q % 2 === 1) {
          const hex = OffsetCoord.qoffsetToCube(OffsetCoord.ODD, new OffsetCoord(q, r));
          const p = layout.hexToPixel(hex);
          map.get(hex.toString())?.forEach(tileIndex => {
            this.add.sprite(p.x, p.y, 'hex_spritesheet');
          });
        }
      }
    }
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}