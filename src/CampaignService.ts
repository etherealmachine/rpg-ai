import JSONRPCService from './JSONRPCService';

export interface CreateCampaignRequest {
    Name: string
    Description: string
}

export interface CreateCampaignResponse {
}

export interface DeleteCampaignRequest {
    ID: number
}

export interface DeleteCampaignResponse {
}

class CampaignService extends JSONRPCService {
    async CreateCampaign(args: CreateCampaignRequest): Promise<CreateCampaignResponse> {
      return this.jsonrpc<CreateCampaignResponse>("CreateCampaign", args);
    }
    async DeleteCampaign(args: DeleteCampaignRequest): Promise<DeleteCampaignResponse> {
      return this.jsonrpc<DeleteCampaignResponse>("DeleteCampaign", args);
    }
}

const service = new CampaignService("CampaignService");
(window as any).CampaignService = service;
export default service;
