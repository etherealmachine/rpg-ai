import { TilesetWithImage } from '../Tiled';

export default class TileHelper {

  tilesets: { [key: string]: TilesetWithImage } = {}
  tilesetIndex: Map<number, TilesetWithImage> = new Map();

  drawTile(ctx: CanvasRenderingContext2D, tileX: number, tileY: number, tileIndex: number) {
    let tileset = this.tilesetIndex.get(tileIndex);
    if (tileset === undefined) {
      const tilesets = Object.values(this.tilesets).filter(tileset => tileset.firstgid);
      const tilesetIndex = tilesets.findIndex(tileset => tileIndex <= tileset.firstgid!) - 1;
      tileset = tilesets[tilesetIndex];
      this.tilesetIndex.set(tileIndex, tileset);
    }
    if (!tileset || !tileset.firstgid || !tileset.imageSource) return;
    const indexInTileset = tileIndex - tileset.firstgid;
    const tilesetX = indexInTileset % tileset.columns;
    const tilesetY = Math.floor(indexInTileset / tileset.columns);
    const spriteX = tilesetX * (tileset.tilewidth + tileset.spacing + tileset.margin);
    const spriteY = tilesetY * (tileset.tileheight + tileset.spacing + tileset.margin);
    ctx.drawImage(
      tileset.imageSource,
      spriteX,
      spriteY,
      tileset.tilewidth,
      tileset.tileheight,
      tileX * tileset.tilewidth,
      tileY * tileset.tileheight,
      tileset.tilewidth,
      tileset.tileheight,
    );
  }

}