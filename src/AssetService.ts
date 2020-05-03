import JSONRPCService from './JSONRPCService';

export interface Asset {
  ID: number
  OwnerID: number
  CreatedAt: string
  Filename: string
  ContentType: string
  Size: number
}

class AssetService extends JSONRPCService {

  async deleteAsset(args: { ID: number }): Promise<void> {
    return this.jsonrpc<void>("DeleteAsset", args);
  }

  async listAssets(): Promise<{ Assets: Asset[] }> {
    return this.jsonrpc<{ Assets: Asset[] }>("ListAssets", {});
  }

}

const assetService = new AssetService("AssetService");
export default assetService;