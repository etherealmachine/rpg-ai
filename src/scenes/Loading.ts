import Phaser from 'phaser';
import GameState from '../GameState';

export default class Loading extends Phaser.Scene {
  state?: GameState

  init(args: any) {
    this.state = args.game;
  }

  create() {
    this.load.image('dungeon', `${process.env.PUBLIC_URL}/images/dungeon.png`);
    this.load.image('characters', `${process.env.PUBLIC_URL}/images/characters.png`);
    this.load.image('general', `${process.env.PUBLIC_URL}/images/general.png`);
    this.load.image('hex_tiles', `${process.env.PUBLIC_URL}/images/hex_tiles.png`);
    this.load.loadComplete = () => {
      this.game.scene.start('HexMap', this.game);
    }
    this.load.start();
  }
}