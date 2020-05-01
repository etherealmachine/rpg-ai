interface JSONRPCResponse {
  id: number
  result: any
  error: any
}

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
  CreatedOn: Date
  LastLogin?: Date
}

function jsonrpc<ReturnType>(path: string, method: string, requestID: number, args: any): Promise<ReturnType> {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.withCredentials = true;
    req.open('POST', path, true);
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    req.onreadystatechange = () => {
      if (req.readyState === 4 && req.status === 200) {
        const resp = JSON.parse(req.responseText) as JSONRPCResponse;
        if (resp.error) {
          reject(resp.error);
        }
        resolve(resp.result);
      }
    };
    req.send(JSON.stringify({
      jsonrpc: "2.0",
      method: method,
      id: requestID,
      params: [args],
    }));
  });
}

export default class APIService {

  path: string;
  requestID: number = 0;

  constructor(path: string) {
    this.path = path;
  }

  async googleLogin(args: { TokenID: string }): Promise<LoginResponse> {
    this.requestID++;
    return jsonrpc<LoginResponse>(this.path, "LoginService.GoogleLogin", this.requestID, args);
  }

  async facebookLogin(args: { AccessToken: string }): Promise<LoginResponse> {
    this.requestID++;
    return jsonrpc<LoginResponse>(this.path, "LoginService.FacebookLogin", this.requestID, args);
  }

}