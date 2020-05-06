import Phaser from 'phaser';
import { Tilemap, Tileset, TilesetSource } from '../Tiled';

export default class OrthoMap extends Phaser.Scene {
  tiledMap?: Tilemap
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl

  init(args: any) {
    this.tiledMap = args.map;
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
    const tiledMap = this.tiledMap;
    if (!tiledMap) return;
    const map = this.make.tilemap({
      width: tiledMap.width,
      height: tiledMap.height,
      tileWidth: tiledMap.tilewidth,
      tileHeight: tiledMap.tileheight,
    });
    const tilesets = tiledMap.tilesets.map(tileset => {
      const source = tileset as TilesetSource;
      const ts = (this.cache.json.get(source.source) as Tileset);
      return map.addTilesetImage(source.source, source.source, ts.tilewidth, ts.tileheight, ts.margin, ts.spacing, source.firstgid);
    });
    map.layers = Phaser.Tilemaps.Parsers.Tiled.ParseTileLayers(tiledMap, false);
    map.objects = Phaser.Tilemaps.Parsers.Tiled.ParseObjectLayers(tiledMap);
    map.layers.forEach(layer => {
      map.createStaticLayer(layer.name, tilesets);
    });
    const gidIndices = tiledMap.tilesets.map((t, i) => [i, t.firstgid]).sort((a, b) => b[1] - a[1]);
    const objects = map.objects.map(layer => this.add.group(layer.objects.map(object => {
      const { gid, x, y } = object;
      const i = (gidIndices.find(gidindex => (gid || 0) >= gidindex[1]) || [0, 0])[0];
      const tileset = tiledMap.tilesets[i] as TilesetSource;
      const s = this.add.sprite(x || 0, y || 0, tileset.source, (gid || 0) - tileset.firstgid);
      s.setDisplayOrigin(0, tiledMap.tileheight);
      return s;
    }), {
      name: layer.name,
    }));
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }

}