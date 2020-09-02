import JSONRPCService from './JSONRPCService';

export interface RunProgramRequest {
    Program: string
}

export interface RunProgramResponse {
    Stdout: string
    Stderr: string
    ReturnCode: number
}

class ClingoService extends JSONRPCService {
    async RunProgram(args: RunProgramRequest): Promise<RunProgramResponse> {
      return this.jsonrpc<RunProgramResponse>("RunProgram", args);
    }
}

const service = new ClingoService("ClingoService");
(window as any).ClingoService = service;
export default service;
