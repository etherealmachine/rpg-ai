import React from 'react';
import { Button } from '@material-ui/core';

import Context from './Context';

interface ConnectionProps {
  context: Context;
}

interface ConnectionState {
  host?: boolean;
  sessionCode?: string;
  signalServer?: WebSocket;
  conn: RTCPeerConnection;
  sendChan: RTCDataChannel;
  recvChan?: RTCDataChannel;
  candidates: RTCIceCandidate[];
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
}

interface RTCMsg {
  peers?: number;
  offer?: RTCSessionDescriptionInit;
  candidates?: RTCIceCandidateInit[];
}

class Connection extends React.Component<ConnectionProps, ConnectionState> {

  constructor(props: ConnectionProps) {
    super(props);
    const conn = new RTCPeerConnection();
    conn.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
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
    conn.ondatachannel = (event) => {
      (window as any).recvChan = event.channel;
      event.channel.onmessage = (event) => { this.handleMessage(JSON.parse(event.data)); };
      event.channel.onopen = () => {
        this.handleConnectionEstablished();
        this.forceUpdate();
      }
      event.channel.onclose = () => {
        this.forceUpdate();
      }
      event.channel.onerror = (err) => { console.error("datachannel error:", err) };
      this.state.signalServer?.close();
      this.setState({
        ...this.state,
        recvChan: event.channel,
      });
    };
    const chan = conn.createDataChannel("sendDatachannel");
    (window as any).sendChan = chan;
    chan.onmessage = (event) => { this.handleMessage(JSON.parse(event.data)); };
    chan.onopen = () => {
      this.forceUpdate();
    }
    chan.onclose = () => {
      this.forceUpdate();
    }
    chan.onerror = (err) => { console.error("datachannel error:", err) };
    let sessionCode = new URLSearchParams(document.location.search).get("sessionCode");
    this.state = {
      sessionCode: sessionCode === null ? undefined : sessionCode,
      conn: conn,
      sendChan: chan,
      candidates: [],
    };
    if (new URLSearchParams(document.location.search).get("sessionCode")) {
      this.connectSession();
    }
  }

  handleConnectionEstablished() {
    if (this.state.host) {
      this.state.sendChan.send(JSON.stringify(this.props.context));
    }
  }

  handleMessage(msg: any) {
    console.log(msg);
  }

  connectSession() {
    let host = false;
    let sessionCode = this.state.sessionCode;
    if (!this.state.sessionCode) {
      host = true;
      sessionCode = this.props.context.motd?.name.replace(/ /g, '-').toLowerCase();
    }
    const protocol = document.location.protocol === 'https' ? 'wss' : 'ws';
    const hostname = document.location.host.includes('localhost') ? 'localhost:8000' : document.location.host;
    const signalServer = new WebSocket(`${protocol}://${hostname}/session/${sessionCode}`);
    signalServer.onopen = () => {
      this.setState({
        ...this.state,
        host: host,
        sessionCode: sessionCode,
        signalServer: signalServer,
      });
    }
    signalServer.onclose = () => this.forceUpdate();
    signalServer.onmessage = async (event) => {
      console.log(event);
      const msg = (JSON.parse(event.data) as RTCMsg);
      if (host && msg.peers === 2) {
        const offer = await this.createOffer();
        signalServer.send(JSON.stringify({
          offer: offer,
          candidates: this.state.candidates,
        }));
      } else if (msg.offer) {
        if (host) {
          await this.handleAnswer(msg.offer, msg.candidates || []);
        } else {
          const answer = await this.createAnswer(msg.offer, msg.candidates || []);
          signalServer.send(JSON.stringify({
            offer: answer,
            candidates: this.state.candidates,
          }));
        }
      }
    }
  }

  async createOffer() {
    console.log('create offer');
    const offer = await this.state.conn.createOffer();
    await this.state.conn.setLocalDescription(offer);
    this.setState({
      ...this.state,
      offer: offer,
    });
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) {
    console.log('create answer');
    await Promise.all(candidates.map((c) => this.state.conn.addIceCandidate(c)));
    await this.state.conn.setRemoteDescription(offer);
    const answer = await this.state.conn.createAnswer();
    console.log(this.state.host, this.state.conn.localDescription, this.state.conn.signalingState, this.state.conn.connectionState);
    await this.state.conn.setLocalDescription(answer);
    this.setState({
      ...this.state,
      answer: answer,
    });
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) {
    console.log('handle answer');
    await Promise.all(candidates.map((c) => this.state.conn.addIceCandidate(c)));
    await this.state.conn.setRemoteDescription(answer);
    this.setState({
      ...this.state,
      answer: answer,
    });
  }

  render() {
    const {
      sessionCode,
      sendChan,
      recvChan,
      signalServer,
      offer,
      answer,
    } = this.state;
    return (<div>
      <div>{sessionCode}</div>
      <div>{sendChan.readyState}</div>
      <div>{recvChan?.readyState}</div>
      <div>{signalServer?.readyState}</div>
      <div>{offer && "sent offer"}</div>
      <div>{answer && "sent answer"}</div>
      <Button onClick={this.connectSession.bind(this)}>Start Session</Button>
    </div>);
  }

}

export default Connection;