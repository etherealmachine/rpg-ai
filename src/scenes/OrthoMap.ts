import Phaser from 'phaser';
import GameState from '../GameState';

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
    const map = this.add.tilemap("example_map");
    const tilesets = map.tilesets.map(tileset => map.addTilesetImage(tileset.name, `${tileset.name}_spritesheet`));
    const newLayers = map.layers.map(layer => {
      return tilesets.map(tileset => {
        return new Phaser.Tilemaps.LayerData({
          ...layer,
          name: layer.name + ' - ' + tileset.name,
        });
      });
    }).flat();
    map.layers = newLayers;
    map.layers.forEach(layer => {
      map.createStaticLayer(layer.name, layer.name.split(' - ')[1]);
    });
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }

}