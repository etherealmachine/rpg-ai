import JSONRPCService from './JSONRPCService';

interface LoginResponse {
  User: User
}

export interface User {
  ID: number
  Email: string
  Admin: {
    Bool: boolean
    Valid: boolean
  }
  CreatedAt: Date
  LastLogin?: Date
}

class LoginService extends JSONRPCService {

  async googleLogin(args: { TokenID: string }): Promise<LoginResponse> {
    return this.jsonrpc<LoginResponse>("GoogleLogin", args);
  }

  async facebookLogin(args: { AccessToken: string }): Promise<LoginResponse> {
    return this.jsonrpc<LoginResponse>("FacebookLogin", args);
  }

}

const loginService = new LoginService("LoginService");
export default loginService;