class Session {

  sessionCode?: string;
  server?: WebSocket;

  public onEvent: (event: string) => void = () => { };
  public onError: (handleSignalServerError: string) => void = () => { };
  public onConnect: () => void = () => { };
  public onMessage: (data: string) => void = () => { };

  public connect(sessionCode: string) {
    const protocol = document.location.protocol === 'https' ? 'wss' : 'ws';
    const hostname = document.location.host.includes('localhost') ? 'localhost:8000' : document.location.host;
    this.server = new WebSocket(`${protocol}://${hostname}/session/${sessionCode}`);
    this.server.onopen = this.handleOpen.bind(this);
    this.server.onclose = this.handleClose.bind(this);
    this.server.onerror = this.handleError.bind(this);
    this.server.onmessage = this.handleMessage.bind(this);
  }

  public send(obj: any) {
    this.server?.send(JSON.stringify(obj));
  }

  public teardown() {
    this.server?.close();
  }

  private handleOpen(event: Event) {
    this.onConnect();
  }

  private handleClose(event: Event) {
    this.onError('server closed unexpectedly');
  }

  private handleError(event: Event) {
    this.onError(`error connecting to server`);
  }

  private async handleMessage(event: MessageEvent) {
    this.onMessage(event.data);
  }

}

export default Session;