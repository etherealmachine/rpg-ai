export interface Tileset {
  name: string
  columns: number
  image: string
  imageheight: number
  imagewidth: number
  margin: number
  spacing: number
  tilecount: number
  tiledversion: string
  tilewidth: number
  tileheight: number
  type: string
  version: number
  firstgid?: number
  spritesheet?: string
  grid?: {
    width: number
    height: number
    orientation: string
  }
  tiles?: TileDefinition[]
}

export interface TilesetWithImage extends Tileset {
  imageSource?: CanvasImageSource
}

export interface TileDefinition {
  id: number
  type: string
}

export interface Tilemap {
  compressionlevel: number
  height: number
  width: number
  orientation: string
  renderorder: string
  staggeraxis?: string
  staggerindex?: string
  tiledversion: string
  version: number
  tileheight: number
  tilewidth: number
  tilesets: (Tileset | TilesetSource)[]
  layers: TilemapLayer[]
  type: string
}

export interface TilesetSource {
  firstgid: number
  source: string
}

export interface TilemapLayer {
  id: number
  name: string
  type: string
  data?: number[]
  height?: number
  width?: number
  properties?: Array<Property>
  x: number
  y: number
  visible: boolean
  opacity: number
}

export interface Property {
  name: string
  type: string
  value: any
}

export function references(objs: (Tilemap | Tileset | string)[]): Set<string> {
  return new Set(objs.map(obj => {
    if (typeof obj === 'object' && obj.type === 'map') {
      return (obj as Tilemap).tilesets.map(tileset => {
        if ((tileset as Tileset).image) {
          return (tileset as Tileset).image;
        } else if ((tileset as TilesetSource).source) {
          return (tileset as TilesetSource).source;
        }
        return null;
      });
    } else if (typeof obj === 'object' && obj.type === 'tileset') {
      return (obj as Tileset).image;
    }
    return obj;
  }).flat().filter(ref => ref) as Array<string>);
}