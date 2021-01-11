import Phaser from 'phaser';
import consumer from '../channels/consumer';

export default class OrthoMap extends Phaser.Scene {
  tiledMap: any;
  mapData: Phaser.Tilemaps.MapData;
  map: Phaser.Tilemaps.Tilemap;

  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  controls: Phaser.Cameras.Controls.SmoothedKeyControl
  objects: Phaser.GameObjects.Group[] = []
  player: Phaser.GameObjects.Sprite
  movementKeys: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
    shift: Phaser.Input.Keyboard.Key
  }

  init(args: { tilemap: any }) {
    this.tiledMap = args.tilemap;
    this.mapData = Phaser.Tilemaps.Parsers.Tiled.ParseJSONTiled(args.tilemap.name, args.tilemap, false);
  }

  preload() {
    fetch('/tilesets/8?format=json')
      .then(response => response.json())
      .then(data => this.load.spritesheet("Avatars", data["image"], { frameWidth: data["tilewidth"], frameHeight: data["tileheight"] }));
    this.mapData.tilesets.forEach(tileset => {
      const tilesetDef = this.tiledMap.tilesets.find((t: any) => t.name == tileset.name);
      this.load.spritesheet(
        tileset.name,
        tilesetDef.image,
        { frameWidth: tilesetDef.tilewidth, frameHeight: tilesetDef.tileheight });
    });
  }

  create() {
    const controlConfig = {
      camera: this.cameras.main,
      //left: this.cursors.left,
      //right: this.cursors.right,
      //up: this.cursors.up,
      //down: this.cursors.down,
      acceleration: 0.5,
      drag: 0.01,
      maxSpeed: 2.0,
      zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };
    this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);
    this.cameras.main.setBackgroundColor('#ddd');
    this.map = this.make.tilemap(this.mapData);
    const tilesets = this.mapData.tilesets.map(tileset => {
      return this.map.addTilesetImage(
        tileset.name,
        tileset.name,
        tileset.tileWidth, tileset.tileHeight,
        tileset.tileMargin, tileset.tileSpacing,
        tileset.firstgid);
    });
    const layers = this.mapData.layers;
    if (layers instanceof Array) {
      this.map.layers = layers;
      layers.forEach((layer, i) => {
        this.map.createLayer(layer.name, tilesets);
        if (i === 1) {
          this.player = this.add.sprite(
            (this.mapData.tileWidth * this.mapData.width) / 2 + 8,
            (this.mapData.tileHeight * this.mapData.height) / 2 + 8,
            "Avatars", 0);
        }
      });
    }
    this.movementKeys = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };
    Object.values(this.movementKeys).forEach(key => key.setEmitOnRepeat(true));
    this.movementKeys.up.on('down', this.moveUp);
    this.movementKeys.down.on('down', this.moveDown);
    this.movementKeys.left.on('down', this.moveLeft);
    this.movementKeys.right.on('down', this.moveRight);
    this.cameras.main.startFollow(this.player);
    (window as any).map = this.map;
    (window as any).tiledMap = this.tiledMap;
    /*
    const subscription = consumer.subscriptions.create({
      channel: "TilemapChannel",
      tilemap_id: this.tiledMap.id,
    }, {
      received: (data: any) => {
        console.log(data);
      },
    });
    (window as any).subscription = subscription;
    */
    this.updateVisibility();
  }

  updateVisibility() {
    this.map.layers.forEach(layer => layer.data.forEach(row => row.forEach(tile => tile.visible = false)));
    const px = Math.floor(this.player.x / this.map.tileWidth);
    const py = Math.floor(this.player.y / this.map.tileHeight);
    const radius = 10;
    const wallLayer = this.map.layers.find(layer => layer.name === "Walls");
    for (let x = px - radius; x < px + radius; x++) {
      for (let y = py - radius; y < py + radius; y++) {
        if (Math.sqrt((px - x) * (px - x) + (py - y) * (py - y)) < radius) {
          const line = new Phaser.Geom.Line(px, py, x, y);
          const points = Phaser.Geom.Line.BresenhamPoints(line);
          for (let i = 0; i < points.length; i++) {
            const point = points[i];
            this.map.layers.forEach(layer => {
              if (point.y in layer.data && point.x in layer.data[point.y]) {
                layer.data[point.y][point.x].visible = true;
              }
            });
            if (point.y in wallLayer.data && point.x in wallLayer.data[point.y] && wallLayer.data[point.y][point.x].index >= 0) {
              break;
            }
          }
        }
      }
    }
  }

  avoidCollision(oldX: number, oldY: number) {
    const collision = this.map.layers.map(layer => {
      return this.map.getTilesWithinWorldXY(this.player.x - 8, this.player.y - 8, 16, 16, null, null, layer.name);
    }).flat().some(tile => tile.properties['collides']);
    if (collision && !this.movementKeys.shift.isDown) {
      this.player.x = oldX;
      this.player.y = oldY;
    } else {
      this.updateVisibility();
    }
  }

  moveUp = () => {
    const [oldX, oldY] = [this.player.x, this.player.y];
    this.player.y -= 16
    if (this.movementKeys.left.isDown) this.player.x -= 16;
    if (this.movementKeys.right.isDown) this.player.x += 16;
    this.avoidCollision(oldX, oldY);
  }

  moveDown = () => {
    const [oldX, oldY] = [this.player.x, this.player.y];
    this.player.y += 16
    if (this.movementKeys.left.isDown) this.player.x -= 16;
    if (this.movementKeys.right.isDown) this.player.x += 16;
    this.avoidCollision(oldX, oldY);
  }

  moveLeft = () => {
    const [oldX, oldY] = [this.player.x, this.player.y];
    this.player.x -= 16;
    if (this.movementKeys.up.isDown) this.player.y -= 16;
    if (this.movementKeys.down.isDown) this.player.y += 16;
    this.avoidCollision(oldX, oldY);
  }

  moveRight = () => {
    const [oldX, oldY] = [this.player.x, this.player.y];
    this.player.x += 16;
    if (this.movementKeys.up.isDown) this.player.y -= 16;
    if (this.movementKeys.down.isDown) this.player.y += 16;
    this.avoidCollision(oldX, oldY);
  }

  update(time: number, delta: number) {
    this.controls?.update(delta);
  }

}