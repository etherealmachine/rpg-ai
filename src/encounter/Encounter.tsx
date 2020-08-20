import React from 'react';
import produce from 'immer';

import { Tilemap, ListSpritesheetsForTilemapRow } from '../AssetService';
import { Character, Encounter } from '../CampaignService';
import { Tilemap as TiledTilemap, TilesetSource, Tileset } from '../Tiled';
import { rasterizeLine } from '../OrthoMath';
import TiledPatternParser from '../map_generator/TiledPatternParser';

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
  mouse?: { x: number, y: number, buttons?: number },
}

export default class EncounterUI extends React.Component<Props, State> {

  canvasRef = React.createRef<HTMLCanvasElement>()
  spritesheetImages: { [key: string]: HTMLImageElement } = {}
  canvasReady = false
  seen: { [key: number]: boolean } = {}
  parser: TiledPatternParser

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
    this.parser = new TiledPatternParser(this.state.tilemap, 3);
    (window as any).encounter = this;
  }

  handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        if (this.canEnter(this.state.position.x, this.state.position.y - 1)) {
          this.setState(produce(this.state, state => { state.position.y--; }));
        }
        break;
      case 'ArrowDown':
        if (this.canEnter(this.state.position.x, this.state.position.y + 1)) {
          this.setState(produce(this.state, state => { state.position.y++; }));
        }
        break;
      case 'ArrowLeft':
        if (this.canEnter(this.state.position.x - 1, this.state.position.y)) {
          this.setState(produce(this.state, state => { state.position.x--; }));
        }
        break;
      case 'ArrowRight':
        if (this.canEnter(this.state.position.x + 1, this.state.position.y)) {
          this.setState(produce(this.state, state => { state.position.x++; }));
        }
        break;
      case 'w':
        this.setState(produce(this.state, state => { state.camera.y -= this.state.tilemap.tileheight; }));
        break;
      case 'a':
        this.setState(produce(this.state, state => { state.camera.x -= this.state.tilemap.tilewidth; }));
        break;
      case 's':
        this.setState(produce(this.state, state => { state.camera.y += this.state.tilemap.tileheight; }));
        break;
      case 'd':
        this.setState(produce(this.state, state => { state.camera.x += this.state.tilemap.tilewidth; }));
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
    }
  }

  handleMouseMove = (event: React.MouseEvent) => {
    const x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - (this.canvasRef.current?.offsetLeft || 0);
    const y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - (this.canvasRef.current?.offsetTop || 0);
    this.setState(produce(this.state, state => {
      state.mouse = { x: x, y: y };
    }));
  }

  handleMouseDown = (event: React.MouseEvent) => {
    const x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - (this.canvasRef.current?.offsetLeft || 0);
    const y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - (this.canvasRef.current?.offsetTop || 0);
    this.setState(produce(this.state, state => {
      state.mouse = { x: x, y: y, buttons: event.buttons };
    }));
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
    ctx.save();
    this.drawMap(ctx, canvas.width, canvas.height);
    ctx.restore();
    if (this.state.mouse) {
      /*
      const x = Math.floor((this.state.mouse.x - offset.x) / this.state.scale / this.state.tilemap.tilewidth);
      const y = Math.floor((this.state.mouse.y - offset.y) / this.state.scale / this.state.tilemap.tileheight);
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(
        x * this.state.tilemap.tilewidth * this.state.scale + offset.x,
        y * this.state.tilemap.tileheight * this.state.scale + offset.y,
        this.state.tilemap.tilewidth * this.state.scale,
        this.state.tilemap.tileheight * this.state.scale
      );
      ctx.font = "18px Arial";
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillText(`${x}, ${y}, ${y * W + x}`, 12, 2 * this.state.tilemap.tileheight);
      */
    }
    ctx.save();
    ctx.translate(canvas.width - 200, 0);
    for (let i = 0; i < this.parser.patterns.length; i++) {
      const pattern = this.parser.patterns[i];
      for (let x = 0; x < this.parser.patternSize; x++) {
        for (let y = 0; y < this.parser.patternSize; y++) {
          const tileIndex = pattern[y * this.parser.patternSize + x];
          if (tileIndex === undefined) continue;
          const tiles = this.parser.tiles[tileIndex].split(',').map(t => parseInt(t));
          for (let tile of tiles) {
            this.drawTile(ctx, x, y, tile);
          }
        }
      }
      ctx.translate(0, this.parser.patternSize * this.state.tilemap.tileheight + 16);
    }
    ctx.restore();
    this.canvasReady = true;
  }

  drawMap(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.scale(this.state.scale, this.state.scale);
    ctx.translate(this.state.camera.x, this.state.camera.y);
    this.state.tilemap.layers.forEach(layer => {
      if (!layer.data) return;
      layer.data.forEach((tileIndex, index) => {
        if (!layer.width || !layer.height) return;
        const tileX = index % layer.width;
        const tileY = Math.floor(index / layer.height);

        const seen = this.seen[tileY * (width / this.state.tilemap.tilewidth) + tileX];
        if (!seen && !this.canSee(tileX, tileY) && this.state.lineOfSight) return;

        this.drawTile(ctx, tileX, tileY, tileIndex);
        this.seen[tileY * (width / this.state.tilemap.tilewidth) + tileX] = true;
      });
    });
    if (this.state.fogOfWar) {
      for (let i = 0; i < width / this.state.tilemap.tilewidth; i++) {
        for (let j = 0; j < height / this.state.tilemap.tileheight; j++) {
          const index = j * (width / this.state.tilemap.tilewidth) + i;
          const dx = i - this.state.position.x;
          const dy = j - this.state.position.y;
          if (this.seen[index] && Math.sqrt(dx * dx + dy * dy) > 10) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(
              i * this.state.tilemap.tilewidth,
              j * this.state.tilemap.tileheight,
              this.state.tilemap.tilewidth,
              this.state.tilemap.tileheight
            );
          }
        }
      }
    }
  }

  drawTile(ctx: CanvasRenderingContext2D, tileX: number, tileY: number, tileIndex: number) {
    const tileset = this.tilesetForTileID(tileIndex);
    if (!tileset || !tileset.firstgid || !tileset.spritesheet) return;
    const indexInTileset = tileIndex - tileset.firstgid;
    const tilesetX = indexInTileset % tileset.columns;
    const tilesetY = Math.floor(indexInTileset / tileset.columns);
    const spriteX = tilesetX * (tileset.tilewidth + tileset.spacing + tileset.margin);
    const spriteY = tilesetY * (tileset.tileheight + tileset.spacing + tileset.margin);
    ctx.drawImage(
      this.spritesheetImages[tileset.spritesheet],
      spriteX,
      spriteY,
      tileset.tilewidth,
      tileset.tileheight,
      tileX * tileset.tilewidth - 2,
      tileY * tileset.tileheight - 2,
      tileset.tilewidth + 2,
      tileset.tileheight + 2,
    );
  }

  render() {
    if (this.canvasReady) {
      this.updateCanvas();
    }
    return <div
      onKeyDown={this.handleKeyDown}
      onMouseMove={this.handleMouseMove}
      onMouseDown={this.handleMouseDown}
      tabIndex={0} style={{ outline: 'none', height: '100%' }}>
      <canvas ref={this.canvasRef} style={{ width: "100%", height: "100%" }}></canvas>
    </div>;
  }
}