export interface Tileset {
  name: string
  columns: number
  grid: {
    width: number
    height: number
    orientation: string
  }
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
  tiles: TileDefinition[]
}

interface TileDefinition {
  id: number
  type: string
}