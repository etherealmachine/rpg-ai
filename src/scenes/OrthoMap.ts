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
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case Phaser.Input.Keyboard.KeyCodes.P:
          this.generateThumbnail();
          break;
        case Phaser.Input.Keyboard.KeyCodes.W:
          this.objects[5].incY(-(this.tiledMap.tileheight || 0));
          break;
        case Phaser.Input.Keyboard.KeyCodes.A:
          this.objects[5].incX(-(this.tiledMap.tilewidth || 0));
          break;
        case Phaser.Input.Keyboard.KeyCodes.S:
          this.objects[5].incY(this.tiledMap.tileheight || 0);
          break;
        case Phaser.Input.Keyboard.KeyCodes.D:
          this.objects[5].incX(this.tiledMap.tilewidth || 0);
          break;
      }
    });
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
    const gidIndices = tiledMap.tilesets.map((t, i) => [i, t.firstgid]).sort((a, b) => b[1] - a[1]);
    for (let layer of map.objects) {
      const group = this.add.group({ name: layer.name });
      for (let object of layer.objects) {
        const { gid, x, y, width, height, polygon, polyline } = object;
        if (x === undefined || y === undefined) {
          continue;
        }
        if (gid) {
          const i = gidIndices.find(gidindex => gid >= gidindex[1]);
          if (i === undefined) {
            console.error(`no gid index found for ${gid}`);
            continue;
          }
          const tileset = tiledMap.tilesets[i[0]] as TilesetSource;
          const s = this.add.sprite(x, y, tileset.source, gid - tileset.firstgid);
          s.setDisplayOrigin(0, tiledMap.tileheight);
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
          group.add(s);
        } else if (polygon || polyline) {
          const points = polygon || polyline;
          const poly = this.add.polygon(x, y, points, 0x000, 0.2);
          poly.setDisplayOrigin(0, 0);
          group.add(poly);
          poly.setInteractive();
          poly.on('pointerover', () => {
            (window as any).emitter.emit("hoveron", {
              type: "room",
              name: layer.name,
              description: (layer.properties as any)[0]["value"],
            });
          });
          poly.on('pointerout', () => (window as any).emitter.emit("hoveroff"));
        } else if (width && height) {
          const poly = this.add.rectangle(x, y, width, height, 0x000, 0.2);
          poly.setDisplayOrigin(0, 0);
          group.add(poly);
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
      }
      this.objects.push(group);
    }

    this.cameras.main.centerOn((tiledMap.tilewidth * tiledMap.width) / 2, (tiledMap.tileheight * tiledMap.height) / 2);
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }

}