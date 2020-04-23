import React from 'react';
import styled from 'styled-components';
import Phaser from 'phaser';

import GameState from './GameState';

interface Props {
  game: GameState;
}

const Game = styled.div`
  width: 100%;
  height: 100%;
`;

export class UIScene extends Phaser.Scene {
  state?: GameState

  init(args: any) {
    this.state = args.game;
  }

  create() {
    this.load.loadComplete = this.onLoad.bind(this);
    this.load.image('dungeon', `${process.env.PUBLIC_URL}/images/mud/dungeon.png`);
    this.load.start();
  }

  onLoad() {
    const tileSelectorGroup = this.add.group();
    const image = this.game.textures.get("dungeon").getSourceImage();
    const tileSelector = tileSelectorGroup.create(image.width / 2 + 4, image.height / 2 + 4, 'dungeon');
    tileSelector.setInteractive().on('pointerdown', this.pickTile.bind(this));
    (this.game.scene.getScene('Map') as MapScene).onLoad();
  }

  pickTile(pointer: Phaser.Input.Pointer) {
    const image = this.game.textures.get("dungeon").getSourceImage();
    const W = Phaser.Math.Snap.Ceil(image.width / 17, 1);
    const x = Phaser.Math.Snap.Floor(pointer.x, 17) / 17;
    const y = Phaser.Math.Snap.Floor(pointer.y, 17) / 17;
    const selectedTileIndex = y * W + x;
    const mapScene = this.game.scene.getScene('Map') as MapScene;
    mapScene.currentLayer?.putTileAt(selectedTileIndex, mapScene.cursor.x, mapScene.cursor.y);
  }
}

export class MapScene extends Phaser.Scene {
  state?: GameState
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl
  layers: Phaser.Tilemaps.DynamicTilemapLayer[] = []
  currentLayer?: Phaser.Tilemaps.DynamicTilemapLayer
  cursor: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0)
  graphics?: Phaser.GameObjects.Graphics
  mapWidth = 60
  mapHeight = 30

  init(args: any) {
    this.state = args.game;
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
    this.graphics?.clear();
    this.graphics?.lineStyle(1, 0x0, 1.0);
    this.graphics?.strokeRectShape(new Phaser.Geom.Rectangle(16 * this.cursor.x, 16 * this.cursor.y, 16, 16));
    this.graphics?.strokeRectShape(new Phaser.Geom.Rectangle(0, 0, 16 * this.mapWidth, 16 * this.mapHeight));
  }

  onLoad() {
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
        case Phaser.Input.Keyboard.KeyCodes.MINUS:
          if (this.currentLayer) {
            const i = this.layers.indexOf(this.currentLayer);
            console.log(i);
            if (i === -1) break;
            if (i === 0) this.currentLayer = this.layers[this.layers.length - 1];
            else this.currentLayer = this.layers[i - 1];
          }
          break;
        case Phaser.Input.Keyboard.KeyCodes.PLUS:
          if (this.currentLayer) {
            const i = this.layers.indexOf(this.currentLayer);
            console.log(i);
            if (i === -1) break;
            if (i === this.layers.length - 1) this.currentLayer = this.layers[0];
            else this.currentLayer = this.layers[i + 1];
          }
          break;
      }
      this.cursor.x = Phaser.Math.Clamp(this.cursor.x, 0, this.mapWidth - 1);
      this.cursor.y = Phaser.Math.Clamp(this.cursor.y, 0, this.mapHeight - 1);
    });
    this.cameras.main.setBackgroundColor('#ddd');
    const image = this.game.textures.get("dungeon").getSourceImage();
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
      this.make.tilemap({ data: tileData, tileWidth: 16, tileHeight: 16 }),
      this.make.tilemap({ data: tileData, tileWidth: 16, tileHeight: 16 }),
      this.make.tilemap({ data: tileData, tileWidth: 16, tileHeight: 16 }),
    ];
    const tilesets = tilemaps.map((tilemap) => tilemap.addTilesetImage("dungeon", "dungeon", 16, 16, 0, 1));
    this.layers = tilemaps.map((tilemap, i) => tilemap.createDynamicLayer("layer", tilesets[i], 0, 0));
    this.currentLayer = this.layers[0];
    this.graphics = this.add.graphics();
  }

}

function setupPhaser(el: HTMLElement, game: GameState) {
  const gameConfig = {
    parent: el,
    width: el.offsetWidth,
    height: el.offsetHeight,
    pixelArt: true,
  };
  const phaser = new Phaser.Game(gameConfig);
  phaser.scene.add('Map', MapScene, true, { game: game });
  phaser.scene.add('UI', UIScene, true, { game: game });
  el.addEventListener('click', () => {
    (document.activeElement as any).blur();
    el.focus();
  })
}

export default function Map(props: Props) {
  return <Game ref={el => el && setupPhaser(el, props.game)} />;
}