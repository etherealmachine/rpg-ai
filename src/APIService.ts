interface Response {
  id: number
  result: any
  error: any
}

export default class APIService {

  path: string;
  requestID: number = 0;

  constructor(path: string) {
    this.path = path;
  }

  async googleLogin(args: { tokenID: string }): Promise<{ email: string }> {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.open("POST", this.path);
      req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      req.send(JSON.stringify({
        jsonrpc: "2.0",
        method: "APIService.GoogleLogin",
        id: this.requestID,
        params: [args],
      }));
      this.requestID++;
      req.onload = () => {
        const resp = JSON.parse(req.responseText) as Response;
        if (resp.error) {
          reject(resp.error);
        }
        resolve(resp.result);
      }
    });
  }

  async facebookLogin(args: { accessToken: string }): Promise<{ email: string }> {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.open("POST", this.path);
      req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      req.send(JSON.stringify({
        jsonrpc: "2.0",
        method: "APIService.FacebookLogin",
        id: this.requestID,
        params: [args],
      }));
      this.requestID++;
      req.onload = () => {
        const resp = JSON.parse(req.responseText) as Response;
        if (resp.error) {
          reject(resp.error);
        }
        resolve(resp.result);
      }
    });
  }

}