
import JSONRPCService from './JSONRPCService';

export interface DeleteAssetRequest {
  ID: number
}

export interface DeleteAssetResponse {
}

export interface DeleteAssetRequest {
  ID: number
}

export interface DeleteAssetResponse {
}

export interface ListAssetsRequest {
}

export interface ListAssetsResponse {
  Spritesheets: ListSpritesheetsByOwnerIDRow[] | null
  Tilemaps: ListTilemapsByOwnerIDRow[] | null
}

export interface ListSpritesheetsForTilemapRequest {
  TilemapID: number
}

export interface ListSpritesheetsForTilemapResponse {
  References: ListSpritesheetsForTilemapRow[] | null
}

export interface ListSpritesheetsByOwnerIDRow {
  ID: number
  CreatedAt: Date
  Name: string
  SpritesheetSize: any
  ImageSize: any
}

export interface ListSpritesheetsForTilemapRow {
  TilemapID: number
  SpritesheetID: number
  SpritesheetName: string
}

export interface ListTilemapsByOwnerIDRow {
  ID: number
  CreatedAt: Date
  Name: string
  TilemapSize: any
}

class AssetService extends JSONRPCService {
    async DeleteSpritesheet(args: DeleteAssetRequest): Promise<DeleteAssetResponse> {
      return this.jsonrpc<DeleteAssetResponse>("DeleteSpritesheet", args);
    }
    async DeleteTilemap(args: DeleteAssetRequest): Promise<DeleteAssetResponse> {
      return this.jsonrpc<DeleteAssetResponse>("DeleteTilemap", args);
    }
    async ListAssets(args: ListAssetsRequest): Promise<ListAssetsResponse> {
      return this.jsonrpc<ListAssetsResponse>("ListAssets", args);
    }
    async ListReferences(args: ListSpritesheetsForTilemapRequest): Promise<ListSpritesheetsForTilemapResponse> {
      return this.jsonrpc<ListSpritesheetsForTilemapResponse>("ListReferences", args);
    }
}

const service = new AssetService("AssetService");
(window as any).AssetService = service;
export default service;