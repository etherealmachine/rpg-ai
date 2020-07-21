import JSONRPCService from './JSONRPCService';

export interface AddCharacterToCampaignParams {
    CampaignID: number
    CharacterID: number
    OwnerID: number
}

export interface Empty {
}

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

export interface RemoveCharacterFromCampaignParams {
    ID: number
    OwnerID: number
}

export interface Empty {
}

export interface UpdateCampaignParams {
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
}

export interface Empty {
}

export interface NullString {
    String: string
    Valid: boolean
}

class CampaignService extends JSONRPCService {
    async AddCharacterToCampaign(args: AddCharacterToCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("AddCharacterToCampaign", args);
    }
    async CreateCampaign(args: CreateCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("CreateCampaign", args);
    }
    async DeleteCampaign(args: DeleteCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("DeleteCampaign", args);
    }
    async RemoveCharacterFromCampaign(args: RemoveCharacterFromCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("RemoveCharacterFromCampaign", args);
    }
    async UpdateCampaign(args: UpdateCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("UpdateCampaign", args);
    }
}

const service = new CampaignService("CampaignService");
(window as any).CampaignService = service;
export default service;
