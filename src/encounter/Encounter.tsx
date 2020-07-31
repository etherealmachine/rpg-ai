import React from 'react';
import produce from 'immer';

import { Tilemap, ListSpritesheetsForTilemapRow } from '../AssetService';
import { Character, Encounter } from '../CampaignService';
import { Tilemap as TiledTilemap, TilemapLayer, TilesetSource, Tileset } from '../Tiled';
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
}

export default class EncounterUI extends React.Component<Props, State> {

  canvasRef = React.createRef<HTMLCanvasElement>()
  spritesheetImages: { [key: string]: HTMLImageElement } = {}
  canvasReady = false
  seen: { [key: number]: boolean } = {}

  constructor(props: Props) {
    super(props);
    this.state = {
      tilemap: ((props.Tilemap.Definition as unknown) as TiledTilemap),
      position: { x: 0, y: 0 },
      scale: 1,
      camera: { x: 0, y: 0 },
    };
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
    }
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
      x: (canvas.width / 2) - this.state.camera.x,
      y: (canvas.height / 2) - this.state.camera.y,
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
        if (!seen && !this.canSee(tileX, tileY)) return;

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