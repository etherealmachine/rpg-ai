import JSONRPCService from './JSONRPCService';

export interface CreateCampaignParams {
    OwnerID: number
    Name: string
    Description: NullString
}

export interface Empty {
}

export interface DeleteCampaignParams {
    ID: number
    OwnerID: number
}

export interface Empty {
}

export interface NullString {
    String: string
    Valid: boolean
}

class CampaignService extends JSONRPCService {
    async CreateCampaign(args: CreateCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("CreateCampaign", args);
    }
    async DeleteCampaign(args: DeleteCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("DeleteCampaign", args);
    }
}

const service = new CampaignService("CampaignService");
(window as any).CampaignService = service;
export default service;
