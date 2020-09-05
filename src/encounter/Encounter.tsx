import React from 'react';
import produce from 'immer';
import { enableMapSet } from 'immer';

import { Tilemap, ListSpritesheetsForTilemapRow } from '../AssetService';
import { Character, Encounter } from '../CampaignService';
import { Tilemap as TiledTilemap, TilesetSource, Tileset } from '../Tiled';
import TileHelper from './TileHelper';
import Parser from './Parser';
import Generator from './ClingoGenerator';

enableMapSet();

interface Props {
  Encounter: Encounter
  Tilemap: Tilemap
  Spritesheets: ListSpritesheetsForTilemapRow[]
  Character: Character
}

interface State {
  baseTilemap: TiledTilemap,
  tilemaps: Map<number, Map<number, TiledTilemap>>,
  position: { x: number, y: number },
  scale: number,
  camera: { x: number, y: number },
  fogOfWar: boolean,
  lineOfSight: boolean,
  mouse?: { x: number, y: number, buttons?: number },
  selectedTiles: { x: number, y: number }[],
}

export default class EncounterUI extends React.Component<Props, State> {

  canvasRef = React.createRef<HTMLCanvasElement>()
  canvasReady = false
  seen: { [key: number]: boolean } = {}
  tileHelper: TileHelper = new TileHelper()
  generator: Generator

  constructor(props: Props) {
    super(props);
    const tilemap = ((props.Tilemap.Definition as unknown) as TiledTilemap);
    this.state = {
      baseTilemap: tilemap,
      tilemaps: new Map([[0, new Map([[0, tilemap]])]]),
      position: { x: 0, y: 0 },
      scale: 1,
      camera: { x: 0, y: 0 },
      fogOfWar: false,
      lineOfSight: false,
      selectedTiles: [],
    };
    (window as any).encounter = this;
    this.generator = new Generator(new Parser(tilemap, this.tileHelper, 2), 10, 10);
  }

  handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      /*
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
      */
      case 'w':
        this.setState(produce(this.state, state => { state.camera.y -= this.state.baseTilemap.tileheight; }));
        break;
      case 'a':
        this.setState(produce(this.state, state => { state.camera.x -= this.state.baseTilemap.tilewidth; }));
        break;
      case 's':
        this.setState(produce(this.state, state => { state.camera.y += this.state.baseTilemap.tileheight; }));
        break;
      case 'd':
        this.setState(produce(this.state, state => { state.camera.x += this.state.baseTilemap.tilewidth; }));
        break;
      case 'q':
        this.setState(produce(this.state, state => { state.scale = Math.max(state.scale - 0.1, 1) }));
        break;
      case 'e':
        this.setState(produce(this.state, state => { state.scale = Math.min(state.scale + 0.1, 4) }));
        break;
      case 'c':
        this.setState(produce(this.state, state => {
          state.camera.x = state.position.x * state.baseTilemap.tilewidth * state.scale;
          state.camera.y = state.position.y * state.baseTilemap.tileheight * state.scale;
        }));
        break;
      case 'n':
        /*
        this.generator.generate().then(generated => {
          this.setState(produce(this.state, state => {
            if (state.tilemaps.get(state.baseTilemap.width) === undefined) state.tilemaps.set(state.baseTilemap.width, new Map());
            state.tilemaps.get(state.baseTilemap.width)?.set(0, generated);
          }));
        });
        */
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
    const tile = this.canvasPosToTilePos(x, y);
    this.setState(produce(this.state, state => {
      state.mouse = { x: x, y: y, buttons: event.buttons };
      if (tile.x < 0 || tile.x >= state.baseTilemap.width || tile.y < 0 || tile.y >= state.baseTilemap.height) {
        state.selectedTiles = [];
      } else if (event.altKey) {
        state.selectedTiles.push(tile);
      } else {
        state.selectedTiles = [tile];
      }
    }));
  }

  /*
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
  */

  componentDidMount() {
    Promise.all(this.state.baseTilemap.tilesets.map(tileset => {
      if ((tileset as TilesetSource).source === undefined) return null;
      const source = (tileset as TilesetSource).source;
      const spritesheet = this.props.Spritesheets.find(spritesheet => spritesheet.SpritesheetName === source);
      if (!spritesheet) return null;
      const image = new Image();
      image.src = `/spritesheet/image/${spritesheet.SpritesheetHash}`;
      this.tileHelper.tilesets[source] = spritesheet.SpritesheetDefinition as unknown as Tileset;
      this.tileHelper.tilesets[source].firstgid = tileset.firstgid;
      this.tileHelper.tilesets[source].imageSource = image;
      return new Promise((resolve, _reject) => {
        image.onload = resolve;
      });
    })).then(this.updateCanvas);
  }

  canvasPosToTilePos(x: number, y: number): { x: number, y: number } {
    return {
      x: Math.floor((x - this.state.camera.x) / this.state.scale / this.state.baseTilemap.tilewidth),
      y: Math.floor((y - this.state.camera.y) / this.state.scale / this.state.baseTilemap.tileheight),
    };
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
    ctx.scale(this.state.scale, this.state.scale);
    ctx.translate(this.state.camera.x, this.state.camera.y);
    for (let [offsetX, tilemaps] of this.state.tilemaps.entries()) {
      for (let [offsetY, tilemap] of tilemaps.entries()) {
        ctx.save();
        ctx.translate(offsetX * this.state.baseTilemap.tilewidth, offsetY * this.state.baseTilemap.tileheight);
        this.drawMap(ctx, tilemap);
        ctx.restore();
      }
    }
    for (let tile of this.state.selectedTiles) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(
        tile.x * this.state.baseTilemap.tilewidth,
        tile.y * this.state.baseTilemap.tileheight,
        this.state.baseTilemap.tilewidth,
        this.state.baseTilemap.tileheight
      );
    }
    if (this.state.selectedTiles.length > 0) {
      const selected = this.state.selectedTiles[0];
      ctx.save()
      ctx.translate(this.state.baseTilemap.tilewidth * (this.state.baseTilemap.width + 2), 0);
      ctx.textBaseline = 'top';
      ctx.fillText(`${selected.x}, ${selected.y}`, 0, 0);
      ctx.translate(0, 16);
      this.generator.parser.drawCompatible(ctx, selected);
      ctx.restore();
    }
    ctx.restore();
    this.canvasReady = true;
  }

  drawMap(ctx: CanvasRenderingContext2D, map: TiledTilemap) {
    map.layers.forEach(layer => {
      if (!layer.data) return;
      layer.data.forEach((tileIndex, index) => {
        if (!layer.width || !layer.height) return;
        const tileX = index % layer.width;
        const tileY = Math.floor(index / layer.width);
        this.tileHelper.drawTile(ctx, tileX, tileY, tileIndex);
        //const seen = this.seen[tileY * (width / this.state.tilemap.tilewidth) + tileX];
        //if (!seen && !this.canSee(tileX, tileY) && this.state.lineOfSight) return;
        //this.seen[tileY * (width / this.state.tilemap.tilewidth) + tileX] = true;
      });
    });
    /*
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
    */
  }

  drawStack(ctx: CanvasRenderingContext2D, tileX: number, tileY: number, tiles: number[]) {
    for (let tile of tiles) {
      this.tileHelper.drawTile(ctx, tileX, tileY, tile);
    }
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