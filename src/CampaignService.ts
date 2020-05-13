import JSONRPCService from './JSONRPCService';

class CampaignService extends JSONRPCService {
}

const service = new CampaignService("CampaignService");
(window as any).CampaignService = service;
export default service;
