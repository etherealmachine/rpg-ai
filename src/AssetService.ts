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
    Spritesheets: Spritesheet[] | null
    Tilemaps: FilledTilemap[] | null
}

export interface ListSpritesheetsForTilemapRequest {
    TilemapID: number
}

export interface ListSpritesheetsForTilemapResponse {
    References: ListSpritesheetsForTilemapRow[] | null
}

export interface UpdateSpritesheetParams {
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
    Definition: string
    Image: string
}

export interface Empty {
}

export interface UpdateTilemapParams {
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
    Definition: string
}

export interface Empty {
}

export interface FilledTilemap {
        
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
    Definition: string
    Hash: string
    CreatedAt: Date

    Thumbnails: Thumbnail[] | null
}

export interface ListSpritesheetsForTilemapRow {
    TilemapID: number
    SpritesheetID: number
    SpritesheetName: string
    SpritesheetHash: string
    SpritesheetDefinition: string
}

export interface NullInt32 {
    Int32: number
    Valid: boolean
}

export interface NullString {
    String: string
    Valid: boolean
}

export interface Spritesheet {
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
    Definition: string
    Image: string
    Hash: string
    CreatedAt: Date
}

export interface Thumbnail {
    ID: number
    TilemapID: NullInt32
    SpritesheetID: NullInt32
    Image: string
    Hash: string
    ContentType: string
    Width: number
    Height: number
    CreatedAt: Date
}

export interface Tilemap {
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
    Definition: string
    Hash: string
    CreatedAt: Date
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
    async UpdateSpritesheet(args: UpdateSpritesheetParams): Promise<Empty> {
      return this.jsonrpc<Empty>("UpdateSpritesheet", args);
    }
    async UpdateTilemap(args: UpdateTilemapParams): Promise<Empty> {
      return this.jsonrpc<Empty>("UpdateTilemap", args);
    }
}

const service = new AssetService("AssetService");
(window as any).AssetService = service;
export default service;
