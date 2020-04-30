import Phaser from 'phaser';
import GameState from '../GameState';
import { Tileset } from '../Tiled';

export default class Loading extends Phaser.Scene {
  state?: GameState
  tilesets = [
    'hex',
    'characters',
    'general',
    'indoors',
    'dungeon',
  ]
  tilemaps = [
    'example_map',
    'example_hexmap',
  ]

  init(args: any) {
    this.state = args.game;
  }

  preload() {
    this.tilesets.forEach(name => {
      this.load.json(name + '_tileset', `${process.env.PUBLIC_URL}/assets/${name}.json`);
    });
    this.tilemaps.forEach(name => {
      this.load.tilemapTiledJSON(name, `${process.env.PUBLIC_URL}/assets/${name}.json`);
    });
  }

  create() {
    this.tilesets.forEach(name => {
      const tileset = this.cache.json.get(name + '_tileset') as Tileset;
      this.load.spritesheet(name + '_spritesheet', `${process.env.PUBLIC_URL}/assets/${tileset.image}`, {
        frameWidth: tileset.tilewidth,
        frameHeight: tileset.tileheight,
      });
    });
    this.load.loadComplete = () => {
      this.game.scene.start('HexMap', this.game);
    }
    this.load.start();
  }
}