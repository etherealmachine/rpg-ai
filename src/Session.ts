interface RTCMsg {
  peers?: number;
  offer?: RTCSessionDescriptionInit;
  candidates?: RTCIceCandidateInit[];
}

class Session {

  host?: boolean;
  sessionCode?: string;
  signalServer?: WebSocket;
  conn?: RTCPeerConnection;
  sendChan?: RTCDataChannel;
  recvChan?: RTCDataChannel;
  candidates: RTCIceCandidate[] = [];

  onEvent: (event: string) => void = () => { };
  onError: (handleSignalServerError: string) => void = () => { };
  onConnect: () => void = () => { };

  setup() {
    this.conn = new RTCPeerConnection();
    this.conn.onicecandidate = this.handleIceCandidate.bind(this);
    this.conn.ondatachannel = this.handleDataChannel.bind(this);
    this.sendChan = this.conn.createDataChannel("sendDatachannel");
    this.sendChan.onmessage = this.handleChannelMessage.bind(this);
    this.sendChan.onopen = this.handleChannelOpen.bind(this);
    this.sendChan.onclose = this.handleChannelClose.bind(this);
    this.sendChan.onerror = this.handleChannelError.bind(this);
  }

  teardown() {
    this.host = undefined;
    this.sessionCode = undefined;
    this.conn?.close();
    this.sendChan?.close();
    this.recvChan?.close();
    this.signalServer?.close();
    this.conn = undefined;
    this.signalServer = undefined;
    this.sendChan = undefined;
    this.recvChan = undefined;
    this.candidates = [];
  }

  handleIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (!event || !event.candidate) return;
    if (this.signalServer?.readyState === 1) {
      this.signalServer.send(JSON.stringify({
        candidates: [event.candidate],
      }));
    }
    this.candidates.push(event.candidate);
  }

  handleDataChannel(event: RTCDataChannelEvent) {
    this.recvChan = event.channel;
    this.recvChan.onmessage = this.handleChannelMessage.bind(this);
    this.recvChan.onopen = this.handleChannelOpen.bind(this);
    this.recvChan.onclose = this.handleChannelClose.bind(this);
    this.recvChan.onerror = this.handleChannelError.bind(this);
  }

  handleChannelOpen(event: Event) {
    if (this.sendChan?.readyState === 'open' && this.recvChan?.readyState === 'open') {
      this.onConnect();
    }
  }

  handleChannelClose(event: Event) {
    this.onError("session lost");
    this.teardown();
  }

  handleChannelError(error: RTCErrorEvent) {
    this.onError(`${error}`);
  }

  handleChannelMessage(event: MessageEvent) {
  }

  connectSession(sessionCode: string, host: boolean) {
    this.host = host;
    this.setup();
    this.setupSignalServer(sessionCode);
  }

  setupSignalServer(sessionCode: string) {
    const protocol = document.location.protocol === 'https' ? 'wss' : 'ws';
    const hostname = document.location.host.includes('localhost') ? 'localhost:8000' : document.location.host;
    this.signalServer = new WebSocket(`${protocol}://${hostname}/session/${sessionCode}`);
    this.signalServer.onopen = this.handleSignalServerOpen.bind(this);
    this.signalServer.onclose = this.handleSignalServerClose.bind(this);
    this.signalServer.onerror = this.handleSignalServerError.bind(this);
    this.signalServer.onmessage = this.handleSignalServerMessage.bind(this);
  }

  handleSignalServerOpen(event: Event) {
    this.onEvent("waiting for peer");
  }

  handleSignalServerClose(event: Event) {
    this.onError('signal server closed unexpectedly');
  }

  handleSignalServerError(event: Event) {
    this.onError(`signal server error: ${event}`);
  }

  async handleSignalServerMessage(event: MessageEvent) {
    const msg = JSON.parse(event.data) as RTCMsg;
    if (msg.peers === 2 && this.host) {
      this.onEvent("found a peer, sending offer");
      const offer = await this.createOffer();
      this.signalServer?.send(JSON.stringify({
        offer: offer,
        candidates: this.candidates,
      }));
    } else if (this.host && msg.offer && msg.offer.type === 'answer') {
      this.onEvent("got answer, setting up rtc connection");
      await this.handleAnswer(msg.offer, msg.candidates || []);
    } else if (!this.host && msg.offer && msg.offer.type === 'offer') {
      this.onEvent("got offer, sending answer");
      const answer = await this.createAnswer(msg.offer, msg.candidates || []);
      this.signalServer?.send(JSON.stringify({
        offer: answer,
        candidates: this.candidates,
      }));
    } else if (msg.candidates) {
      this.onEvent("adding ice candidates");
      await Promise.all(msg.candidates.map((c) => this.conn?.addIceCandidate(c)));
    }
  }

  async createOffer() {
    if (this.conn === undefined) {
      this.onError('tried to create offer on undefined RTC connection');
      return;
    }
    const offer = await this.conn.createOffer();
    await this.conn.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) {
    if (this.conn === undefined) {
      this.onError('tried to create answer on undefined RTC connection');
      return;
    }
    await Promise.all(candidates.map((c) => this.conn?.addIceCandidate(c)));
    await this.conn.setRemoteDescription(offer);
    const answer = await this.conn.createAnswer();
    await this.conn.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) {
    if (this.conn === undefined) {
      this.onError('tried to handle answer on undefined RTC connection');
      return;
    }
    await Promise.all(candidates.map((c) => this.conn?.addIceCandidate(c)));
    await this.conn.setRemoteDescription(answer);
  }

}

export default Session;