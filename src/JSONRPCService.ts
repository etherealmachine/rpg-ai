interface JSONRPCResponse {
  id: number
  result: any
  error: any
}

export default class JSONRPCService {

  path: string = window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api';
  service: string
  requestID: number = 0

  constructor(service: string) {
    this.service = service;
  }

  jsonrpc<ReturnType>(method: string, args: any): Promise<ReturnType> {
    this.requestID++;
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.withCredentials = true;
      req.open('POST', this.path, true);
      req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      req.setRequestHeader("X-CSRF-Token", (window as any).csrfToken);
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
    });
  }

}