import JSONRPCService from './JSONRPCService';

export interface AddCharacterToEncounterParams {
    EncounterID: number
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

export interface CreateCharacterParams {
    OwnerID: number
    Name: string
    Definition: string
}

export interface Empty {
}

export interface CreateEncounterParams {
    CampaignID: number
    Name: string
    Description: NullString
    TilemapID: NullInt32
    OwnerID: number
}

export interface Empty {
}

export interface DeleteCampaignParams {
    ID: number
    OwnerID: number
}

export interface Empty {
}

export interface DeleteCharacterParams {
    ID: number
    OwnerID: number
}

export interface Empty {
}

export interface DeleteEncounterParams {
    ID: number
    OwnerID: number
}

export interface Empty {
}

export interface Empty {
}

export interface ListCampaignsResponse {
    Campaigns: FilledCampaign[] | null
}

export interface Empty {
}

export interface ListCharactersResponse {
    Characters: Character[] | null
}

export interface RemoveCharacterFromEncounterParams {
    EncounterID: number
    CharacterID: number
    OwnerID: number
}

export interface Empty {
}

export interface SearchCharactersRequest {
    Name: string
}

export interface ListCharactersResponse {
    Characters: Character[] | null
}

export interface UpdateCampaignParams {
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
}

export interface Empty {
}

export interface UpdateCharacterParams {
    ID: number
    OwnerID: number
    Name: string
}

export interface Empty {
}

export interface UpdateEncounterParams {
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
    TilemapID: NullInt32
}

export interface Empty {
}

export interface Campaign {
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
    CreatedAt: Date
}

export interface Character {
    ID: number
    OwnerID: number
    Name: string
    Definition: string
    Sprite: string
    CreatedAt: Date
}

export interface Encounter {
    ID: number
    CampaignID: number
    Name: string
    Description: NullString
    TilemapID: NullInt32
    CreatedAt: Date
}

export interface FilledCampaign {
        
    ID: number
    OwnerID: number
    Name: string
    Description: NullString
    CreatedAt: Date

    Encounters: FilledEncounter[] | null
    Characters: Character[] | null
}

export interface FilledEncounter {
        
    ID: number
    CampaignID: number
    Name: string
    Description: NullString
    TilemapID: NullInt32
    CreatedAt: Date

    Tilemap: Tilemap
    Characters: Character[] | null
}

export interface NullInt32 {
    Int32: number
    Valid: boolean
}

export interface NullString {
    String: string
    Valid: boolean
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

class CampaignService extends JSONRPCService {
    async AddCharacterToEncounter(args: AddCharacterToEncounterParams): Promise<Empty> {
      return this.jsonrpc<Empty>("AddCharacterToEncounter", args);
    }
    async CreateCampaign(args: CreateCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("CreateCampaign", args);
    }
    async CreateCharacter(args: CreateCharacterParams): Promise<Empty> {
      return this.jsonrpc<Empty>("CreateCharacter", args);
    }
    async CreateEncounter(args: CreateEncounterParams): Promise<Empty> {
      return this.jsonrpc<Empty>("CreateEncounter", args);
    }
    async DeleteCampaign(args: DeleteCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("DeleteCampaign", args);
    }
    async DeleteCharacter(args: DeleteCharacterParams): Promise<Empty> {
      return this.jsonrpc<Empty>("DeleteCharacter", args);
    }
    async DeleteEncounter(args: DeleteEncounterParams): Promise<Empty> {
      return this.jsonrpc<Empty>("DeleteEncounter", args);
    }
    async ListCampaigns(args: Empty): Promise<ListCampaignsResponse> {
      return this.jsonrpc<ListCampaignsResponse>("ListCampaigns", args);
    }
    async ListCharacters(args: Empty): Promise<ListCharactersResponse> {
      return this.jsonrpc<ListCharactersResponse>("ListCharacters", args);
    }
    async RemoveCharacterFromEncounter(args: RemoveCharacterFromEncounterParams): Promise<Empty> {
      return this.jsonrpc<Empty>("RemoveCharacterFromEncounter", args);
    }
    async SearchCharacters(args: SearchCharactersRequest): Promise<ListCharactersResponse> {
      return this.jsonrpc<ListCharactersResponse>("SearchCharacters", args);
    }
    async UpdateCampaign(args: UpdateCampaignParams): Promise<Empty> {
      return this.jsonrpc<Empty>("UpdateCampaign", args);
    }
    async UpdateCharacter(args: UpdateCharacterParams): Promise<Empty> {
      return this.jsonrpc<Empty>("UpdateCharacter", args);
    }
    async UpdateEncounter(args: UpdateEncounterParams): Promise<Empty> {
      return this.jsonrpc<Empty>("UpdateEncounter", args);
    }
}

const service = new CampaignService("CampaignService");
(window as any).CampaignService = service;
export default service;
