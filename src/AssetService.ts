
import JSONRPCService from './JSONRPCService';

export interface DeleteAssetRequest {
  ID: number
}

export interface DeleteAssetResponse {
}

export interface ListAssetsRequest {
}

export interface ListAssetsResponse {
  Assets: ListAssetMetadataByOwnerIDRow[]
}

export interface ListAssetMetadataByOwnerIDRow {
  ID: number
  OwnerID: number
  CreatedAt: Date
  Filename: string
  ContentType: string
  Size: any
}

class AssetService extends JSONRPCService {
    async DeleteAsset(args: DeleteAssetRequest): Promise<DeleteAssetResponse> {
      return this.jsonrpc<DeleteAssetResponse>("DeleteAsset", args);
    }
    async ListAssets(args: ListAssetsRequest): Promise<ListAssetsResponse> {
      return this.jsonrpc<ListAssetsResponse>("ListAssets", args);
    }
}

const service = new AssetService("AssetService");
export default service;
