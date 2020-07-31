import Phaser from 'phaser';

import { Tilemap, Tileset, TilesetSource } from '../Tiled';
import { Tilemap as TilemapModel } from '../AssetService';
import { SetTilemapThumbnail } from '../AssetUploader';

export default class OrthoMap extends Phaser.Scene {
  tilemapModel!: TilemapModel
  tiledMap!: Tilemap
  controls?: Phaser.Cameras.Controls.SmoothedKeyControl
  objects: Phaser.GameObjects.Group[] = []

  init(args: any) {
    this.tilemapModel = args.tilemapModel;
    this.tiledMap = args.map;
    (window as any).map = this;
  }

  generateThumbnail() {
    const tiledMap = this.tiledMap;
    if (!tiledMap) return;
    const mapWidth = tiledMap.tilewidth * tiledMap.width;
    const mapHeight = tiledMap.tileheight * tiledMap.height;
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);

    this.game.renderer.snapshotArea(
      (this.game.canvas.width - mapWidth) / 2, (this.game.canvas.height - mapHeight) / 2,
      mapWidth, mapHeight,
      image => {
        const c = document.createElement("canvas");
        c.setAttribute("width", `${mapWidth}px`);
        c.setAttribute("height", `${mapHeight}px`);
        c.getContext("2d")?.drawImage(image as HTMLImageElement, 0, 0);
        (c as HTMLCanvasElement).toBlob(blob => {
          if (!blob) return;
          if (this.tilemapModel) SetTilemapThumbnail(this.tilemapModel.ID, blob);
        });
      })
  }

  onKeyDown = (event: KeyboardEvent) => {
    switch (event.keyCode) {
      case Phaser.Input.Keyboard.KeyCodes.P:
        this.generateThumbnail();
        break;
      case Phaser.Input.Keyboard.KeyCodes.W:
        this.objects[4].incY(-(this.tiledMap.tileheight || 0));
        break;
      case Phaser.Input.Keyboard.KeyCodes.A:
        this.objects[4].incX(-(this.tiledMap.tilewidth || 0));
        break;
      case Phaser.Input.Keyboard.KeyCodes.S:
        this.objects[4].incY(this.tiledMap.tileheight || 0);
        break;
      case Phaser.Input.Keyboard.KeyCodes.D:
        this.objects[4].incX(this.tiledMap.tilewidth || 0);
        break;
    }
  }

  addObjectAnnotation(layer: Phaser.Tilemaps.ObjectLayer, object: Phaser.Types.Tilemaps.TiledObject): Phaser.GameObjects.Sprite | null {
    const { gid, x, y } = object;
    if (gid === undefined || x === undefined || y === undefined) return null;
    const gidIndices = this.tiledMap.tilesets.map((t, i) => [i, t.firstgid || -1]).sort((a, b) => b[1] - a[1]);
    const i = gidIndices.find(gidindex => gid >= gidindex[1]);
    if (i === undefined) {
      console.error(`no gid index found for ${gid}`);
      return null;
    }
    const tileset = this.tiledMap.tilesets[i[0]] as TilesetSource;
    const s = this.add.sprite(x, y, tileset.source, gid - tileset.firstgid);
    s.setDisplayOrigin(0, this.tiledMap.tileheight);
    s.setInteractive();
    s.on('pointerover', () => {
      let description = '';
      if (object.properties) {
        description = (object.properties as any)[0]["value"];
      }
      (window as any).emitter.emit("hoveron", {
        type: "npc",
        name: layer.name,
        description: description,
      });
    });
    s.on('pointerout', () => (window as any).emitter.emit("hoveroff"));
    return s;
  }

  addPolygonAnnotation(layer: Phaser.Tilemaps.ObjectLayer, object: Phaser.Types.Tilemaps.TiledObject) {
    const points = object.polygon || object.polyline;
    const poly = this.add.polygon(object.x, object.y, points, 0x000, 0.2);
    poly.setDisplayOrigin(0, 0);
    poly.setInteractive();
    poly.on('pointerover', () => {
      (window as any).emitter.emit("hoveron", {
        type: "room",
        name: layer.name,
        description: (layer.properties as any)[0]["value"],
      });
    });
    poly.on('pointerout', () => (window as any).emitter.emit("hoveroff"));
  }

  addRectangleAnnotation(layer: Phaser.Tilemaps.ObjectLayer, object: Phaser.Types.Tilemaps.TiledObject) {
    const poly = this.add.rectangle(object.x, object.y, object.width, object.height, 0x000, 0.2);
    poly.setDisplayOrigin(0, 0);
    poly.setInteractive();
    poly.on('pointerover', () => {
      (window as any).emitter.emit("hoveron", {
        type: "room",
        name: layer.name,
        description: (layer.properties as any)[0]["value"],
      });
    });
    poly.on('pointerout', () => (window as any).emitter.emit("hoveroff"));
  }

  create() {
    const tiledMap = this.tiledMap;
    if (!tiledMap) return;
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
    this.input.keyboard.on('keydown', this.onKeyDown);
    this.cameras.main.setBackgroundColor('#ddd');
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
    for (let layer of map.objects) {
      const group = this.add.group({ name: layer.name });
      for (let object of layer.objects) {
        if (object.x === undefined || object.y === undefined) {
          continue;
        }
        if (object.gid) {
          const s = this.addObjectAnnotation(layer, object);
          if (s) {
            group.add(s);
          }
        } else if (object.polygon || object.polyline) {
          this.addPolygonAnnotation(layer, object);
        } else if (object.width && object.height) {
          this.addRectangleAnnotation(layer, object);
        }
      }
      this.objects.push(group);
    }
    const overlay = new Phaser.Tilemaps.LayerData({
      name: 'Overlay',
      x: 0,
      y: 0,
      width: map.layers[0].width,
      height: map.layers[0].height,
      data: map.layers[0].data.map((tiles: Phaser.Tilemaps.Tile[]) => 0),
    });
    map.layers.unshift(overlay);
    map.createDynamicLayer(overlay.name, tilesets);
    this.cameras.main.centerOn((tiledMap.tilewidth * tiledMap.width) / 2, (tiledMap.tileheight * tiledMap.height) / 2);
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }

}