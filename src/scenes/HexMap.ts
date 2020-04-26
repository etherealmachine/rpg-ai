import Phaser from 'phaser';
import GameState from '../GameState';

export default class HexMap extends Phaser.Scene {
  state?: GameState
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl
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
    this.cameras.main.setBackgroundColor('#fff');
    const image = this.game.textures.get("hex_tiles").getSourceImage();
    this.cameras.main.setScroll(-image.width - 40, -40);

    const tileWidth = 32;
    const tileHeight = 48;

    const layerData = new Phaser.Tilemaps.LayerData({
      tileWidth: tileWidth,
      tileHeight: tileHeight,
    });

    const mapData = new Phaser.Tilemaps.MapData({
      name: 'hexmap',
      tileWidth: tileWidth,
      tileHeight: tileHeight,
      format: Phaser.Tilemaps.Formats.ARRAY_2D,
      layers: [layerData],
      orientation: 'hexagonal',
    });

    const tiles = [];
    for (let y = 0; y < this.mapHeight; y++) {
      const row = []
      for (let x = 0; x < this.mapWidth; x++) {
        row.push(new Phaser.Tilemaps.Tile(layerData, Math.floor(Math.random() * 20), x, y, tileWidth, tileHeight, tileWidth, tileHeight));
      }
      tiles.push(row);
    }
    mapData.width = layerData.width = this.mapWidth;
    mapData.height = layerData.height = this.mapHeight;
    mapData.widthInPixels = layerData.widthInPixels = this.mapWidth * mapData.tileWidth;
    mapData.heightInPixels = layerData.heightInPixels = this.mapHeight * mapData.tileHeight;
    layerData.data = tiles;

    const tilemap = new Phaser.Tilemaps.Tilemap(this, mapData);
    console.log(tilemap);
    const tileset = tilemap.addTilesetImage("hex_tiles", "hex_tiles", tileWidth, tileHeight, 0, 0);
    tilemap.layers.forEach(layer => tilemap.createDynamicLayer(layer.name, tileset, 0, 0));
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }
}