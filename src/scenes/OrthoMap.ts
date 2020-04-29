import Phaser from 'phaser';
import GameState from '../GameState';
import { Tilemap } from '../Tiled';

export default class OrthoMap extends Phaser.Scene {
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
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      switch (event.keyCode) {
      }
    });
    this.cameras.main.setBackgroundColor('#ddd');

    const tilemap = this.cache.json.get('example_map') as Tilemap;
    const layers = tilemap.layers.map(layer => {
      const data: number[][] = [];
      for (let y = 0; y < layer.height; y++) {
        const row: number[] = [];
        for (let x = 0; x < layer.width; x++) {
          const tileindex = layer.data.pop();
          row.push(tileindex || 0);
        }
        data.push(row);
      }
      return this.make.tilemap({ data: data, tileWidth: tilemap.tilewidth, tileHeight: tilemap.tileheight });
    });
    const tilesets = tilemaps.map((tilemap) => tilemap.addTilesetImage("dungeon", "dungeon", 16, 16, 0, 1));
    this.layers = tilemaps.map((tilemap, i) => tilemap.createDynamicLayer("layer", tilesets[i], 0, 0));
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }

}