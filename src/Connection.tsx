import React from 'react';
import { Button } from '@material-ui/core';

interface ConnectionState {
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

class Connection extends React.Component<any, ConnectionState> {

  constructor(props: void) {
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
      event.channel.onmessage = (event) => { console.log(event.data); };
      event.channel.onopen = () => {
        console.log('open');
        this.forceUpdate();
      }
      event.channel.onclose = () => {
        console.log('close');
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
    chan.onmessage = (event) => { console.log(event.data); };
    chan.onopen = () => {
      console.log('open');
      this.forceUpdate();
    }
    chan.onclose = () => {
      console.log('close');
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

  connectSession() {
    let host = false;
    let sessionCode = this.state.sessionCode;
    if (!this.state.sessionCode) {
      host = true;
      sessionCode = "dark-orc";
    }
    const signalServer = new WebSocket(`ws://localhost:8000/session/${sessionCode}`);
    signalServer.onopen = () => {
      this.setState({
        ...this.state,
        sessionCode: sessionCode,
        signalServer: signalServer,
      });
    }
    signalServer.onclose = () => this.forceUpdate();
    signalServer.onmessage = async (event) => {
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
    const offer = await this.state.conn.createOffer();
    await this.state.conn.setLocalDescription(offer);
    this.setState({
      ...this.state,
      offer: offer,
    });
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) {
    candidates.forEach((c) => this.state.conn.addIceCandidate(c));
    await this.state.conn.setRemoteDescription(offer);
    const answer = await this.state.conn.createAnswer();
    await this.state.conn.setLocalDescription(answer);
    this.setState({
      ...this.state,
      answer: answer,
    });
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]) {
    if (this.state.conn.signalingState !== 'stable') {
      await this.state.conn.setRemoteDescription(answer);
    }
    await Promise.all(candidates.map((c) => this.state.conn.addIceCandidate(c)));
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