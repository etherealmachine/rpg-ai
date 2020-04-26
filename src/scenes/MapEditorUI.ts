import Phaser from 'phaser';

import OrthoMap from './OrthoMap';
import GameState from '../GameState';

export default class MapEditorUI extends Phaser.Scene {
  state?: GameState
  layerIndexText?: Phaser.GameObjects.Text;

  init(args: any) {
    this.state = args.game;
  }

  create() {
    const tileSelectorGroup = this.add.group();
    const image = this.game.textures.get("hex_tiles").getSourceImage();
    const tileSelector = tileSelectorGroup.create(image.width / 2 + 4, image.height / 2 + 4, 'hex_tiles');
    tileSelector.setInteractive().on('pointerdown', this.pickTile.bind(this));
    const mapScene = this.game.scene.getScene('OrthoMap') as OrthoMap;
    this.layerIndexText = this.add.text(image.width + 4, 4, `Layer ${mapScene.currentLayer}`, {
      fontFamily: '"Roboto Condensed"',
      color: '"black"',
    });
    this.game.scene.run('HexMap', this.game);
  }

  update(time: number, delta: number) {
    const mapScene = this.game.scene.getScene('OrthoMap') as OrthoMap;
    this.layerIndexText?.setText(`Layer ${mapScene.currentLayer}`);
  }

  pickTile(pointer: Phaser.Input.Pointer) {
    const image = this.game.textures.get("dungeon").getSourceImage();
    const W = Phaser.Math.Snap.Ceil(image.width / 17, 1);
    const x = Phaser.Math.Snap.Floor(pointer.x, 17) / 17;
    const y = Phaser.Math.Snap.Floor(pointer.y, 17) / 17;
    const selectedTileIndex = y * W + x;
    const mapScene = this.game.scene.getScene('OrthoMap') as OrthoMap;
    mapScene.layers[mapScene.currentLayer].putTileAt(selectedTileIndex, mapScene.cursor.x, mapScene.cursor.y);
  }
}