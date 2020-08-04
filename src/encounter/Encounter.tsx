import React from 'react';
import produce from 'immer';

import { Tilemap, ListSpritesheetsForTilemapRow } from '../AssetService';
import { Character, Encounter } from '../CampaignService';
import { Tilemap as TiledTilemap, TilesetSource, Tileset } from '../Tiled';
import { rasterizeLine } from '../OrthoMath';

interface Props {
  Encounter: Encounter
  Tilemap: Tilemap
  Spritesheets: ListSpritesheetsForTilemapRow[]
  Character: Character
}

interface State {
  tilemap: TiledTilemap,
  position: { x: number, y: number },
  scale: number,
  camera: { x: number, y: number },
  fogOfWar: boolean,
  lineOfSight: boolean,
}

export default class EncounterUI extends React.Component<Props, State> {

  canvasRef = React.createRef<HTMLCanvasElement>()
  spritesheetImages: { [key: string]: HTMLImageElement } = {}
  canvasReady = false
  seen: { [key: number]: boolean } = {}
  layerTiles: number[][] = []
  layerHashes: string[] = []
  hashCounts: { [key: string]: number } = {}
  hashGraph: { [key: string]: { [key: string]: { [key: string]: number } } } = {}
  entropy: number[] = []
  allowedHashes: { hash: string, count: number }[][] = []
  neighbors = [
    { dir: 'north', x: 0, y: -1 },
    { dir: 'east', x: 1, y: 0 },
    { dir: 'south', x: 0, y: 1 },
    { dir: 'west', x: -1, y: 0 },
  ]

  constructor(props: Props) {
    super(props);
    this.state = {
      tilemap: ((props.Tilemap.Definition as unknown) as TiledTilemap),
      position: { x: 0, y: 0 },
      scale: 1,
      camera: { x: 0, y: 0 },
      fogOfWar: false,
      lineOfSight: false,
    };
    this.parseTuples();
    this.calculateEntropy();
    (window as any).encounter = this;
  }

  handleKeyPress = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'w':
        if (this.canEnter(this.state.position.x, this.state.position.y - 1)) {
          this.setState(produce(this.state, state => { state.position.y--; }));
        }
        break;
      case 'a':
        if (this.canEnter(this.state.position.x - 1, this.state.position.y)) {
          this.setState(produce(this.state, state => { state.position.x--; }));
        }
        break;
      case 's':
        if (this.canEnter(this.state.position.x, this.state.position.y + 1)) {
          this.setState(produce(this.state, state => { state.position.y++; }));
        }
        break;
      case 'd':
        if (this.canEnter(this.state.position.x + 1, this.state.position.y)) {
          this.setState(produce(this.state, state => { state.position.x++; }));
        }
        break;
      case 'q':
        this.setState(produce(this.state, state => { state.scale = Math.max(state.scale - 0.1, 1) }));
        break;
      case 'e':
        this.setState(produce(this.state, state => { state.scale = Math.min(state.scale + 0.1, 4) }));
        break;
      case 'c':
        this.setState(produce(this.state, state => {
          state.camera.x = state.position.x * state.tilemap.tilewidth * state.scale;
          state.camera.y = state.position.y * state.tilemap.tileheight * state.scale;
        }));
        break;
      case 'n':
        this.collapseStep();
        break;
    }
  }

  parseTuples() {
    this.layerTiles = [];
    this.layerHashes = [];
    const W = this.state.tilemap.width;
    const H = this.state.tilemap.height;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const layers: number[] = [];
        for (let layer of this.state.tilemap.layers) {
          if (!layer.data) continue;
          layers.push(layer.data[y * W + x]);
        }
        this.layerTiles.push(layers);
        this.layerHashes.push(layers.join(':'));
      }
    }
    this.hashCounts = {};
    this.hashGraph = {};
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const t = this.layerHashes[y * W + x];
        if (this.hashCounts[t] === undefined) this.hashCounts[t] = 0;
        this.hashCounts[t]++;
        for (let neighbor of this.neighbors) {
          const nx = x + neighbor.x;
          const ny = y + neighbor.y;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const n = this.layerHashes[ny * W + nx];
            if (this.hashGraph[n] === undefined) this.hashGraph[n] = {};
            if (this.hashGraph[n][neighbor.dir] === undefined) this.hashGraph[n][neighbor.dir] = {};
            if (this.hashGraph[n][neighbor.dir][t] === undefined) this.hashGraph[n][neighbor.dir][t] = 0;
            this.hashGraph[n][neighbor.dir][t]++;
          }
        }
      }
    }
  }

  calculateEntropy() {
    const W = this.state.tilemap.width;
    const H = this.state.tilemap.height;
    this.entropy = [];
    this.allowedHashes = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let tileEntropy = 0;
        let allowedHashes: { hash: string, count: number }[] = [];
        if (this.layerTiles[y * W + x].reduce((acc, t) => t + acc, 0) === 0) {
          for (let neighbor of this.neighbors) {
            const nx = x + neighbor.x;
            const ny = y + neighbor.y;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
              const n = this.layerHashes[ny * W + nx];
              const neighborHashes = this.hashGraph[n][neighbor.dir];
              if (neighborHashes) {
                Object.entries(neighborHashes).forEach(([hash, count]) => {
                  allowedHashes.push({ hash: hash, count: count });
                });
              }
            }
          }
          if (allowedHashes.length === 0) {
            Object.entries(this.hashCounts).forEach(([hash, count]) => {
              allowedHashes.push({ hash: hash, count: count });
            });
          }
          const sum = allowedHashes.reduce((acc, h) => acc + h.count, 0);
          const logSum = allowedHashes.reduce((acc, h) => acc + h.count * Math.log(h.count), 0);
          tileEntropy = Math.log(sum) - logSum / sum;
        }
        this.allowedHashes.push(allowedHashes);
        this.entropy.push(tileEntropy);
      }
    }
  }

  collapseStep() {
    this.calculateEntropy();
    const W = this.state.tilemap.width;
    const H = this.state.tilemap.height;
    const minNonZeroEntropy = this.entropy.reduce((min, e) => e > 0 && e < min ? e : min, Infinity);
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const e = this.entropy[y * W + x];
        if (e === minNonZeroEntropy) {
          const selection = this.lottery(this.allowedHashes[y * W + x]);
          const tiles = selection.hash.split(':').map(t => parseInt(t));
          this.layerTiles[y * W + x] = tiles;
          tiles.forEach((tileIndex, layerIndex) => {
            this.state.tilemap.layers[layerIndex].data![y * W + x] = tileIndex;
          });
          this.updateCanvas();
          return;
        }
      }
    }
  }

  lottery(arr: { hash: string, count: number }[]) {
    const sum = arr.reduce((acc, h) => acc + h.count, 0);
    const selected = Math.random() * sum;
    let total = 0;
    let winner = -1;
    for (let i = 0; i < arr.length; i++) {
      total += arr[i].count;
      if (selected <= total) {
        winner = i;
        break;
      }
    }
    return arr[winner];
  }

  canEnter(x: number, y: number): boolean {
    if (x < 0) return false;
    if (x >= this.state.tilemap.width) return false;
    if (y < 0) return false;
    if (y >= this.state.tilemap.height) return false;
    let canEnter = false;
    for (let layer of this.state.tilemap.layers) {
      if (!layer.data) continue;
      const collide = layer.properties && layer.properties.find(prop => prop.name === 'collision');
      const tile = layer.data[y * this.state.tilemap.width + x];
      if (tile > 0 && collide) {
        return false;
      }
      if (tile > 0) {
        canEnter = true;
      }
    }
    return canEnter;
  }

  canSee(x: number, y: number): boolean {
    const dx = x - this.state.position.x;
    const dy = y - this.state.position.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) return false;
    for (let point of rasterizeLine(this.state.position.x, this.state.position.y, x, y)) {
      if (this.isWall(point.x, point.y)) {
        if (x === point.x && y === point.y) {
          return true;
        }
        return false;
      }
    }
    return true;
  }

  isWall(x: number, y: number): boolean {
    for (let layer of this.state.tilemap.layers) {
      if (!layer.data) continue;
      const collide = layer.properties && layer.properties.find(prop => prop.name === 'collision');
      if (!collide) continue;
      const tile = layer.data[y * this.state.tilemap.width + x];
      if (tile > 0) return true;
    }
    return false;
  }

  componentDidMount() {
    Promise.all(this.state.tilemap.tilesets.map(tileset => {
      if ((tileset as TilesetSource).source === undefined) return null;
      const spritesheet = this.props.Spritesheets.find(spritesheet => spritesheet.SpritesheetName === (tileset as TilesetSource).source);
      if (!spritesheet) return null;
      const image = new Image();
      image.src = `/spritesheet/image/${spritesheet.SpritesheetHash}`;
      this.spritesheetImages[spritesheet.SpritesheetHash] = image;
      return new Promise((resolve, _reject) => {
        image.onload = resolve;
      });
    })).then(this.updateCanvas);
  }

  tilesetForTileID(index: number) {
    const tilesetIndex = this.state.tilemap.tilesets.filter(tileset => tileset.firstgid).findIndex(tileset => index <= tileset.firstgid!) - 1;
    const tileset = this.state.tilemap.tilesets[tilesetIndex];
    if (tileset === undefined) return null;
    if ((tileset as TilesetSource).source === undefined) return null;
    const spritesheet = this.props.Spritesheets.find(spritesheet => spritesheet.SpritesheetName === (tileset as TilesetSource).source);
    if (spritesheet === undefined) return null;
    const definition = (spritesheet.SpritesheetDefinition as unknown) as Tileset;
    definition.firstgid = tileset.firstgid;
    definition.spritesheet = spritesheet.SpritesheetHash;
    return definition;
  }

  updateCanvas = () => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== canvas.offsetWidth) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const offset = {
      x: 100,
      y: 100,
    };
    this.state.tilemap.layers.forEach(layer => {
      if (!layer.data) return;
      layer.data.forEach((tileIndex, index) => {
        if (!layer.width || !layer.height) return;
        const tileset = this.tilesetForTileID(tileIndex);
        if (!tileset || !tileset.firstgid || !tileset.spritesheet) return;
        const tileX = index % layer.width;
        const tileY = Math.floor(index / layer.height);
        const worldX = index % layer.width * tileset.tilewidth;
        const worldY = Math.floor(index / layer.height) * tileset.tileheight;

        const seen = this.seen[tileY * (canvas.width / this.state.tilemap.tilewidth) + tileX];
        if (!seen && !this.canSee(tileX, tileY) && this.state.lineOfSight) return;

        const indexInTileset = tileIndex - tileset.firstgid;
        const tilesetX = indexInTileset % tileset.columns;
        const tilesetY = Math.floor(indexInTileset / tileset.columns);
        const xPosition = tilesetX * (tileset.tilewidth + tileset.spacing + tileset.margin);
        const yPosition = tilesetY * (tileset.tileheight + tileset.spacing + tileset.margin);
        ctx.drawImage(
          this.spritesheetImages[tileset.spritesheet],
          xPosition,
          yPosition,
          tileset.tilewidth,
          tileset.tileheight,
          worldX * this.state.scale + offset.x - 2,
          worldY * this.state.scale + offset.y - 2,
          tileset.tilewidth * this.state.scale + 2,
          tileset.tileheight * this.state.scale + 2,
        );
        this.seen[tileY * (canvas.width / this.state.tilemap.tilewidth) + tileX] = true;
      });
    });
    if (this.state.fogOfWar) {
      for (let i = 0; i < canvas.width / this.state.tilemap.tilewidth; i++) {
        for (let j = 0; j < canvas.height / this.state.tilemap.tileheight; j++) {
          const index = j * (canvas.width / this.state.tilemap.tilewidth) + i;
          const dx = i - this.state.position.x;
          const dy = j - this.state.position.y;
          if (this.seen[index] && Math.sqrt(dx * dx + dy * dy) > 10) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(
              i * this.state.tilemap.tilewidth * this.state.scale + offset.x,
              j * this.state.tilemap.tileheight * this.state.scale + offset.y,
              this.state.tilemap.tilewidth * this.state.scale,
              this.state.tilemap.tileheight * this.state.scale
            );
          }
        }
      }
    }
    const W = this.state.tilemap.width;
    const H = this.state.tilemap.height;
    const maxEntropy = this.entropy.reduce((max, e) => Math.max(e, max), 0);
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const e = this.entropy[y * W + x] / maxEntropy;
        ctx.fillStyle = `rgba(0, 0, 0, ${e})`;
        ctx.fillRect(
          x * this.state.tilemap.tilewidth * this.state.scale + offset.x,
          y * this.state.tilemap.tileheight * this.state.scale + offset.y,
          this.state.tilemap.tilewidth * this.state.scale,
          this.state.tilemap.tileheight * this.state.scale
        );
      }
    }
    ctx.fillStyle = 'red';
    ctx.fillRect(
      this.state.position.x * this.state.tilemap.tilewidth * this.state.scale + offset.x,
      this.state.position.y * this.state.tilemap.tileheight * this.state.scale + offset.y,
      this.state.tilemap.tilewidth * this.state.scale,
      this.state.tilemap.tileheight * this.state.scale
    );
    this.canvasReady = true;
  }

  render() {
    if (this.canvasReady) {
      this.updateCanvas();
    }
    return <div onKeyPress={this.handleKeyPress} tabIndex={0} style={{ outline: 'none', height: '100%' }}>
      <canvas ref={this.canvasRef} style={{ width: "100%", height: "100%" }}></canvas>
    </div>;
  }
}