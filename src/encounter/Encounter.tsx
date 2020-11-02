import React from 'react';
import produce from 'immer';

import { Tilemap, ListSpritesheetsForTilemapRow } from '../AssetService';
import { Character, Encounter } from '../CampaignService';
import { Tilemap as TiledTilemap, TilesetSource, Tileset } from '../Tiled';
import Node from './TilemapTree';
import TileHelper from './TileHelper';
import Parser from './Parser';
import GeneratorWorker from 'worker-loader!./WFCGenerator'; // eslint-disable-line import/no-webpack-loader-syntax

interface Props {
  Encounter: Encounter
  Tilemap: Tilemap
  Spritesheets: ListSpritesheetsForTilemapRow[]
  Character: Character
}

interface State {
  baseTilemap: TiledTilemap,
  tree: Node,
  fogOfWar: boolean,
  lineOfSight: boolean,
}

export default class EncounterUI extends React.Component<Props, State> {

  canvasRef = React.createRef<HTMLCanvasElement>()
  canvasReady = false
  tileHelper: TileHelper = new TileHelper()
  parser: Parser

  dirty: boolean = true
  scale: number
  camera: { x: number, y: number }
  mouse?: { x: number, y: number, buttons?: number }
  selectionStart?: { x: number, y: number }
  selectionEnd?: { x: number, y: number }

  constructor(props: Props) {
    super(props);
    const tilemap = ((props.Tilemap.Definition as unknown) as TiledTilemap);
    this.state = {
      baseTilemap: tilemap,
      tree: new Node(tilemap),
      fogOfWar: false,
      lineOfSight: false,
    };
    this.scale = 1;
    this.camera = { x: 0, y: 0 };
    (window as any).encounter = this;
    this.parser = new Parser(tilemap, this.tileHelper, 2);
  }

  handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'w':
        this.camera.y -= this.scale * this.state.baseTilemap.tileheight;
        break;
      case 'a':
        this.camera.x -= this.scale * this.state.baseTilemap.tilewidth;
        break;
      case 's':
        this.camera.y += this.scale * this.state.baseTilemap.tileheight;
        break;
      case 'd':
        this.camera.x += this.scale * this.state.baseTilemap.tilewidth;
        break;
      case 'q':
        this.scale = Math.max(this.scale - 0.1, 1);
        break;
      case 'e':
        this.scale = Math.min(this.scale + 0.1, 4);
        break;
      case 'g':
        if (this.selectionStart && this.selectionEnd) {
          const [start, end] = [this.canvasPosToTilePos(this.selectionStart), this.canvasPosToTilePos(this.selectionEnd)];
          const [targetWidth, targetHeight] = [end.x - start.x, end.y - start.y];
          const worker = new GeneratorWorker();
          worker.addEventListener('message', (message: any) => {
            if (message.data.generated) {
              this.setState(produce(this.state, state => {
                state.tree.insert(start.x, start.y, message.data.generated);
              }));
            } else if (message.data.error) {
              console.error(message.data.error);
            } else {
              console.log(message);
            }
          });
          worker.postMessage({ parser: JSON.parse(JSON.stringify(this.parser)), targetWidth, targetHeight });
        }
        break;
    }
    this.dirty = true;
  }

  handleMouseMove = (event: React.MouseEvent) => {
    let x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - (this.canvasRef.current?.offsetLeft || 0);
    let y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - (this.canvasRef.current?.offsetTop || 0);
    this.mouse = { x, y, buttons: event.buttons };
    if (this.selectionStart && event.buttons === 1) {
      if (event.shiftKey) {
        const w = x - this.selectionStart.x;
        const h = y - this.selectionStart.y;
        x = this.selectionStart.x + Math.min(w, h);
        y = this.selectionStart.y + Math.min(w, h);
      }
      this.selectionEnd = { x, y };
    }
    this.dirty = true;
  }

  handleMouseDown = (event: React.MouseEvent) => {
    const x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - (this.canvasRef.current?.offsetLeft || 0);
    const y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop - (this.canvasRef.current?.offsetTop || 0);
    this.mouse = { x: x, y: y, buttons: event.buttons };
    if (event.buttons === 1) {
      this.selectionStart = { x, y };
      this.selectionEnd = undefined;
    }
    this.dirty = true;
  }

  handleMouseUp = (event: React.MouseEvent) => {
    if (this.selectionStart && this.selectionEnd) {
      this.selectionStart = this.tilePosToCanvasPos(this.canvasPosToTilePos(this.selectionStart));
      this.selectionEnd = this.tilePosToCanvasPos(this.canvasPosToTilePos(this.selectionEnd));
    }
    this.dirty = true;
  }

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
    })).then(() => {
      window.requestAnimationFrame(this.updateCanvas);
    });
  }

  canvasPosToTilePos(pos: { x: number, y: number }): { x: number, y: number } {
    return {
      x: Math.floor((pos.x - this.camera.x) / this.scale / this.state.baseTilemap.tilewidth),
      y: Math.floor((pos.y - this.camera.y) / this.scale / this.state.baseTilemap.tileheight),
    };
  }

  tilePosToCanvasPos(pos: { x: number, y: number }): { x: number, y: number } {
    const xScale = this.scale * this.state.baseTilemap.tilewidth;
    const yScale = this.scale * this.state.baseTilemap.tileheight;
    return {
      x: pos.x * xScale + this.camera.x * this.scale,
      y: pos.y * yScale + this.camera.y * this.scale,
    };
  }

  updateCanvas = () => {
    this.canvasReady = true;
    window.requestAnimationFrame(this.updateCanvas);
    if (!this.dirty) {
      return;
    }
    this.dirty = false;
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
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.camera.x, this.camera.y);
    const minVisible = this.canvasPosToTilePos({ x: 0, y: 0 });
    const maxVisible = this.canvasPosToTilePos({ x: canvas.width, y: canvas.height });
    for (let node of this.state.tree.retrieve(minVisible.x, minVisible.y, maxVisible.x, maxVisible.y)) {
      if (node.tilemap) this.drawMap(ctx, node.tilemap);
    }
    ctx.restore();
    if (this.selectionStart) {
      let end = this.selectionEnd;
      if (end === undefined) {
        end = {
          x: this.selectionStart.x + this.state.baseTilemap.tilewidth * this.scale,
          y: this.selectionStart.y + this.state.baseTilemap.tileheight * this.scale,
        };
      } else {
        ctx.font = '24px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        const selectionWidth = Math.floor((end.x - this.selectionStart.x) / this.scale / this.state.baseTilemap.tilewidth);
        const selectionHeight = Math.floor((end.y - this.selectionStart.y) / this.scale / this.state.baseTilemap.tileheight);
        ctx.fillText(
          `${selectionWidth} x ${selectionHeight}`,
          (end.x - this.selectionStart.x) / 2 + this.selectionStart.x,
          (end.y - this.selectionStart.y) / 2 + this.selectionStart.y);
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(
        this.selectionStart.x, this.selectionStart.y,
        end.x - this.selectionStart.x, end.y - this.selectionStart.y);
    }
    ctx.restore();
  }

  drawMap(ctx: CanvasRenderingContext2D, map: TiledTilemap) {
    map.layers.forEach(layer => {
      if (!layer.data) return;
      layer.data.forEach((tileIndex, index) => {
        if (!layer.width || !layer.height) return;
        const tileX = index % layer.width;
        const tileY = Math.floor(index / layer.width);
        this.tileHelper.drawTile(ctx, tileX, tileY, tileIndex);
      });
    });
  }

  drawStack(ctx: CanvasRenderingContext2D, tileX: number, tileY: number, tiles: number[]) {
    for (let tile of tiles) {
      this.tileHelper.drawTile(ctx, tileX, tileY, tile);
    }
  }

  render() {
    if (this.canvasReady) {
      this.dirty = true;
    }
    return <div
      onKeyDown={this.handleKeyDown}
      onMouseMove={this.handleMouseMove}
      onMouseDown={this.handleMouseDown}
      onMouseUp={this.handleMouseUp}
      tabIndex={0} style={{ outline: 'none', height: '100%' }}>
      <canvas ref={this.canvasRef} style={{ width: "100%", height: "100%" }}></canvas>
    </div>;
  }
}