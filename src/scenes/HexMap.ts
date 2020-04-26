import Phaser from 'phaser';
import GameState from '../GameState';

export default class OrthoMap extends Phaser.Scene {
  state?: GameState
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl
  layers: Phaser.Tilemaps.DynamicTilemapLayer[] = []
  currentLayer: number = -1
  cursor: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0)
  graphics?: Phaser.GameObjects.Graphics
  mapWidth = 60
  mapHeight = 30

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
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.W:
          this.cursor.y -= 1;
          break;
        case Phaser.Input.Keyboard.KeyCodes.A:
          this.cursor.x -= 1;
          break;
        case Phaser.Input.Keyboard.KeyCodes.S:
          this.cursor.y += 1;
          break;
        case Phaser.Input.Keyboard.KeyCodes.D:
          this.cursor.x += 1;
          break;
        case Phaser.Input.Keyboard.KeyCodes.DELETE:
        case Phaser.Input.Keyboard.KeyCodes.BACKSPACE:
          this.layers[this.currentLayer].removeTileAt(this.cursor.x, this.cursor.y);
          break;
        case Phaser.Input.Keyboard.KeyCodes.MINUS:
          if (this.currentLayer === -1) break;
          if (this.currentLayer === 0) this.currentLayer = this.layers.length - 1;
          else this.currentLayer--;
          break;
        case Phaser.Input.Keyboard.KeyCodes.PLUS:
          if (this.currentLayer === -1) break;
          if (this.currentLayer === this.layers.length - 1) this.currentLayer = 0;
          else this.currentLayer++;
          break;
      }
      this.cursor.x = Phaser.Math.Clamp(this.cursor.x, 0, this.mapWidth - 1);
      this.cursor.y = Phaser.Math.Clamp(this.cursor.y, 0, this.mapHeight - 1);
    });
    this.cameras.main.setBackgroundColor('#ddd');
    const image = this.game.textures.get("hex_tiles").getSourceImage();
    this.cameras.main.setScroll(-image.width - 40, -40);
    const tileData = [];
    for (let y = 0; y < this.mapHeight; y++) {
      const row = []
      for (let x = 0; x < this.mapWidth; x++) {
        row.push(-1);
      }
      tileData.push(row);
    }
    const tilemaps = [
      this.make.tilemap({ data: tileData, tileWidth: 32, tileHeight: 32 }),
      this.make.tilemap({ data: tileData, tileWidth: 32, tileHeight: 32 }),
      this.make.tilemap({ data: tileData, tileWidth: 32, tileHeight: 32 }),
    ];
    const tilesets = tilemaps.map((tilemap) => tilemap.addTilesetImage("hex_tiles", "hex_tiles", 32, 32, 0, 0));
    this.layers = tilemaps.map((tilemap, i) => tilemap.createDynamicLayer("layer", tilesets[i], 0, 0));
    this.currentLayer = 0;
    this.graphics = this.add.graphics();
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
    this.graphics?.clear();
    this.graphics?.lineStyle(1, 0x0, 1.0);
    this.graphics?.strokeRectShape(new Phaser.Geom.Rectangle(16 * this.cursor.x, 16 * this.cursor.y, 16, 16));
    this.graphics?.strokeRectShape(new Phaser.Geom.Rectangle(0, 0, 16 * this.mapWidth, 16 * this.mapHeight));
  }
}