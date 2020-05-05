interface JSONRPCResponse {
  id: number
  result: any
  error: any
}

const host: string = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

export default class JSONRPCService {

  service: string
  requestID: number = 0

  constructor(service: string) {
    this.service = service;
  }

  async jsonrpc<ReturnType>(method: string, args: any): Promise<ReturnType> {
    this.requestID++;
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.withCredentials = true;
      req.open('POST', host + '/api', true);
      req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      JSONRPCService.csrfToken().then(csrfToken => {
        req.setRequestHeader("X-CSRF-Token", csrfToken);
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
          method: this.service + "." + method,
          id: this.requestID,
          params: [args],
        }));
      }).catch(err => {
        reject(`Failed to fetch csrf token: ${err}`);
      });
    });
  }

  static async csrfToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.withCredentials = true;
      req.open('GET', host + '/csrf', true);
      req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {
          resolve(req.responseText);
        } else if (req.status !== 200) {
          reject(req.status);
        }
      };
      req.send();
    });
  }

}