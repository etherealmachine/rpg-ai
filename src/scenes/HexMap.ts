import Phaser from 'phaser';
import GameState from '../GameState';
import Tileset from '../Tileset';

export default class HexMap extends Phaser.Scene {
  state?: GameState
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl
  mapWidth = 20
  mapHeight = 60

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

    const map = [];
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        map.push(water);
      }
    }

    const seedX = Math.floor(this.mapWidth / 2 + Math.random() * 5);
    const seedY = Math.floor(this.mapHeight / 2 + Math.random() * 5);
    const seedIndex = seedY * this.mapWidth + seedX;

    map[seedIndex] = grass;
    const grassTiles = new Set([seedIndex]);

    while (Array.from(grassTiles.keys()).length < 100) {
      const indices = Array.from(grassTiles.keys());
      let j = indices[Math.floor(Math.random() * indices.length)];
      const r = Math.random();
      if (r < 0.1) {
        j += 1;
      } else if (r < 0.2) {
        j -= 1;
      } else if (r < 0.6) {
        j += this.mapWidth;
      } else {
        j -= this.mapWidth;
      }
      map[j] = grass;
      grassTiles.add(j);
    }

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        this.add.sprite(
          x * 48 + ((y % 2 === 0) ? 0 : 24),
          y * 13,
          'hex_spritesheet',
          map[y * this.mapWidth + x]);
      }
    }
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}