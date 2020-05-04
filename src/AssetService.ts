
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

export interface ListReferencesRequest {
  ID: number
}

export interface ListReferencesResponse {
  References: ListReferencesByIDRow[]
}

export interface ListAssetMetadataByOwnerIDRow {
  ID: number
  OwnerID: number
  CreatedAt: Date
  Filename: string
  ContentType: string
  Size: any
}

export interface ListReferencesByIDRow {
  ID: number
  OwnerID: number
  ContentType: string
  Filename: string
  Filedata: string
  CreatedAt: Date
  ID_2: number
  AssetID: number
  ReferencedAssetID: number
}

class AssetService extends JSONRPCService {
    async DeleteAsset(args: DeleteAssetRequest): Promise<DeleteAssetResponse> {
      return this.jsonrpc<DeleteAssetResponse>("DeleteAsset", args);
    }
    async ListAssets(args: ListAssetsRequest): Promise<ListAssetsResponse> {
      return this.jsonrpc<ListAssetsResponse>("ListAssets", args);
    }
    async ListReferences(args: ListReferencesRequest): Promise<ListReferencesResponse> {
      return this.jsonrpc<ListReferencesResponse>("ListReferences", args);
    }
}

const service = new AssetService("AssetService");
(window as any).AssetService = service;
export default service;
