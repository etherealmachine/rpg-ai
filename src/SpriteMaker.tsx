import React from 'react';
import produce from 'immer';

import CampaignService, { CreateNPCResponse } from './CampaignService';
import { SetImage } from './AssetUploader';

interface State {
  url: string
  size: number
  name: string
}

export default class SpriteMaker extends React.Component<void, State> {

  imageRef = React.createRef<HTMLImageElement>()
  canvasRef = React.createRef<HTMLCanvasElement>()
  canvasReady = false

  constructor(props: void) {
    super(props);
    this.state = {
      url: "",
      size: 100,
      name: "",
    };
  }

  onURLChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState(produce(this.state, state => { state.url = event.target.value; }));
  }

  onURLKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      this.updateCanvas();
    }
  }

  onSizeChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState(produce(this.state, state => { state.size = parseInt(event.target.value); }));
  }

  onNameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState(produce(this.state, state => { state.name = event.target.value; }));
  }

  onSaveClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.CreateNPC({
      Name: this.state.name,
      OwnerID: -1,
      Definition: "",
    }).then((resp: CreateNPCResponse) => {
      if (!this.canvasRef.current) return;
      this.canvasRef.current.toBlob(blob => {
        if (!blob) return;
        SetImage(resp.NPC.ID, "npc", blob);
      });
    });
  }

  updateCanvas = () => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== canvas.offsetWidth) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!this.imageRef.current) return;
    let [w1, h1, w2, h2] = [this.imageRef.current.width, this.imageRef.current.height, canvas.width, canvas.height];
    let [xOff, yOff] = [0, 0];
    w2 *= this.state.size / 100;
    h2 *= this.state.size / 100;
    xOff = (canvas.width - w2) / 2;
    yOff = (canvas.height - h2) / 2;
    const aspectRatio = w1 / h1;
    if (aspectRatio <= 1) {
      ctx.drawImage(
        this.imageRef.current,
        0, 0, w1, h1,
        (w2 - (w2 * aspectRatio)) / 2 + xOff, yOff, w2 * aspectRatio, h2);
    } else {
      ctx.drawImage(
        this.imageRef.current,
        0, 0, w1, h1,
        xOff, (h2 - (h2 * (1 / aspectRatio))) / 2 + yOff, w2, h2 * (1 / aspectRatio));
    }
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, 10);
    ctx.fillRect(0, 0, 10, canvas.height);
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height);
    ctx.fillRect(0, canvas.height - 10, canvas.width, canvas.height);
    this.canvasReady = true;
  }

  render() {
    if (this.canvasReady) {
      this.updateCanvas();
    }
    return <div className="d-flex flex-column align-items-center">
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          value={this.state.url}
          onChange={this.onURLChanged}
          onKeyDown={this.onURLKeyDown}
          placeholder="Search"
        />
        <div className="input-group-append">
          <button className="btn btn-primary" onClick={this.updateCanvas}><i className="fa fa-chevron-right" aria-hidden="true"></i></button>
        </div>
      </div>
      <div className="d-flex">
        <div className="m-4">
          <img ref={this.imageRef} src={this.state.url} style={{ display: 'none' }} alt=""></img>
          <canvas ref={this.canvasRef} style={{ width: "400px", height: "400px", border: "2px solid gray" }}></canvas>
        </div>
        <div className="d-flex flex-column m-4">
          <div className="form-inline">
            <label htmlFor="size" className="pr-2">Size</label>
            <input name="size" className="form-control" type="range" min="1" max="100" value={this.state.size} onChange={this.onSizeChanged} />
          </div>
          <div className="form-inline">
            <label htmlFor="name" className="pr-2">Name</label>
            <input name="name" className="form-control" type="text" value={this.state.name} onChange={this.onNameChanged} />
          </div>
          <div className="mt-auto">
            <button className="btn btn-success" onClick={this.onSaveClicked}>Save</button>
          </div>
        </div>
      </div>
    </div >;
  }
}