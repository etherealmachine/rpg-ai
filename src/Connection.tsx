import React from 'react';
import { Checkbox, Button, FormControl, FormGroup, TextField } from '@material-ui/core';
import { withSnackbar, WithSnackbarProps } from 'notistack';

import Context from './Context';

interface ConnectionProps extends WithSnackbarProps {
  context: Context;
}

interface ConnectionState {
  host: boolean;
  sessionCode: string;
  signalServer?: WebSocket;
  conn?: RTCPeerConnection;
  sendChan?: RTCDataChannel;
  recvChan?: RTCDataChannel;
  candidates: RTCIceCandidate[];
}

interface RTCMsg {
  peers?: number;
  offer?: RTCSessionDescriptionInit;
  candidates?: RTCIceCandidateInit[];
}

class Connection extends React.Component<ConnectionProps, ConnectionState> {

  constructor(props: ConnectionProps) {
    super(props);
    this.props.context.onChange((context: Context) => {
      if (context.motd) {
        this.setState({
          ...this.state,
          sessionCode: context.motd.name,
        });
      }
    });
    this.state = {
      host: false,
      sessionCode: '',
      candidates: [],
    }
  }

  setupRTCConnection() {
    const conn = new RTCPeerConnection();
    conn.onicecandidate = this.handleIceCandidate.bind(this);
    conn.ondatachannel = this.handleDataChannel.bind(this);
    const chan = conn.createDataChannel("sendDatachannel");
    chan.onmessage = this.handleChannelMessage.bind(this);
    chan.onopen = this.handleChannelOpen.bind(this);
    chan.onclose = this.handleChannelClose.bind(this);
    chan.onerror = this.handleChannelError.bind(this);
  }

  handleIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (!event || !event.candidate) return;
    if (this.state.signalServer?.readyState === 1) {
      this.state.signalServer.send(JSON.stringify({
        candidates: [event.candidate],
      }));
    }
    this.setState({
      ...this.state,
      candidates: this.state.candidates.concat([event.candidate]),
    });
  }

  handleDataChannel(event: RTCDataChannelEvent) {
    event.channel.onmessage = this.handleChannelMessage.bind(this);
    event.channel.onopen = this.handleChannelOpen.bind(this);
    event.channel.onclose = this.handleChannelClose.bind(this);
    event.channel.onerror = this.handleChannelError.bind(this);
  }

  handleChannelOpen(event: Event) {
  }

  handleChannelClose(event: Event) {
  }

  handleChannelError(error: RTCErrorEvent) {
  }

  handleChannelMessage(event: MessageEvent) {
    console.log(event);
  }

  connectSession() {
    const { sessionCode } = this.state;
    if (!sessionCode) {
      this.props.enqueueSnackbar('Invalid session code');
      return;
    }
    this.setupSignalServer(sessionCode);
  }

  setupSignalServer(sessionCode: string) {
    const protocol = document.location.protocol === 'https' ? 'wss' : 'ws';
    const hostname = document.location.host.includes('localhost') ? 'localhost:8000' : document.location.host;
    const signalServer = new WebSocket(`${protocol}://${hostname}/session/${sessionCode}`);
    signalServer.onopen = this.handleSignalServerOpen.bind(this);
    signalServer.onclose = this.handleSignalServerClose.bind(this);
    signalServer.onerror = this.handleSignalServerError.bind(this);
    signalServer.onmessage = this.handleSignalServerMessage.bind(this);
  }

  handleSignalServerOpen(event: Event) {

  }

  handleSignalServerClose(event: Event) {

  }

  handleSignalServerError(event: Event) {

  }

  handleSignalServerMessage(event: Event) {

  }

  async createOffer() {
    const { conn } = this.state;
    if (conn === undefined) {
      throw new Error('tried to create offer on undefined RTC connection');
    }
    const offer = await conn.createOffer();
    await conn.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) {
    const { conn } = this.state;
    if (conn === undefined) {
      throw new Error('tried to create answer on undefined RTC connection');
    }
    await Promise.all(candidates.map((c) => conn.addIceCandidate(c)));
    await conn.setRemoteDescription(offer);
    const answer = await conn.createAnswer();
    await conn.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) {
    const { conn } = this.state;
    if (conn === undefined) {
      throw new Error('tried to handle answer on undefined RTC connection');
    }
    await Promise.all(candidates.map((c) => conn.addIceCandidate(c)));
    await conn.setRemoteDescription(answer);
  }

  handleSessionCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      ...this.state,
      sessionCode: event.target.value,
    });
  }

  handleHostChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      ...this.state,
      host: event.target.checked,
    });
  }

  renderWaitingForPeer() {
    return <div>Waiting for peer</div>;
  }

  renderEstablishingRTC() {
    return <div>Connecting to peer</div>;
  }

  renderConnectionEstablished() {
    return <div>Connection established</div>;
  }

  renderSessionConnect() {
    const {
      host,
      sessionCode,
    } = this.state;
    return (<FormControl>
      <FormGroup row={true}>
        <Checkbox
          checked={host}
          onChange={this.handleHostChange.bind(this)}
          value="primary"
        />
        <TextField style={{ width: "200px" }} value={sessionCode} onChange={this.handleSessionCodeChange.bind(this)} />
      </FormGroup>
      <Button onClick={this.connectSession.bind(this)}>Connect To Session</Button>
    </FormControl>);
  }

  render() {
    return this.renderSessionConnect();
  }

}

export default withSnackbar(Connection);