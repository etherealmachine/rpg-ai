import JSONRPCService from './JSONRPCService';

export interface FacebookLoginRequest {
    AccessToken: string
}

export interface LoginResponse {
    User: User
}

export interface GoogleLoginRequest {
    TokenID: string
}

export interface LoginResponse {
    User: User
}

export interface User {
    ID: number
    Email: string
    Admin: NullBool
    CreatedAt: Date
    LastLogin: NullTime
}

export interface NullBool {
    Bool: boolean
    Valid: boolean
}

export interface NullTime {
    Time: Date
    Valid: boolean
}

class LoginService extends JSONRPCService {
    async FacebookLogin(args: FacebookLoginRequest): Promise<LoginResponse> {
      return this.jsonrpc<LoginResponse>("FacebookLogin", args);
    }
    async GoogleLogin(args: GoogleLoginRequest): Promise<LoginResponse> {
      return this.jsonrpc<LoginResponse>("GoogleLogin", args);
    }
}

const service = new LoginService("LoginService");
(window as any).LoginService = service;
export default service;
