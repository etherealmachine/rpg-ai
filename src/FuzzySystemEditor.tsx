import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import produce from 'immer';
import { Chart, ChartConfiguration } from 'chart.js';

import { FuzzyVariable, FuzzyRule, FuzzySystem } from './rules/FuzzyLogic';

function chart(v: FuzzyVariable): ChartConfiguration {
  return {
    type: 'line',
    data: {
      datasets: Object.values(v.sets).map(set => ({
        label: set.name,
        data: set.membership.map((v, i) => ({ x: i, y: v })).filter(point => point.y > 0),
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        lineTension: 0,
        spanGaps: true,
      })),
    },
    options: {
      scales: {
        xAxes: [{
          type: 'linear',
          display: true,
          scaleLabel: {
            display: true,
          },
          ticks: {
            min: v.min,
            max: v.max,
            stepSize: (v.max - v.min) / v.resolution,
          }
        }],
      }
    }
  };
}

function FuzzyRuleEditor(r: FuzzyRule) {

}

type StateChangeFunction = (state: State) => void;

function FuzzyVariableEditor(props: { variable: FuzzyVariable, stateChange: (f: StateChangeFunction) => void }) {
  const { variable, stateChange } = props;
  const chartRef = useRef(null);
  useEffect(() => {
    const el = (chartRef.current as HTMLCanvasElement | null);
    if (el === null) return;
    const ctx = el.getContext('2d');
    if (ctx === null) return;
    new Chart(ctx, chart(variable));
  });
  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    stateChange((state: State) => {
      if (state.system.inputs[variable.name] !== undefined) {
        const tmp = state.system.inputs[variable.name];
        delete state.system.inputs[variable.name];
        tmp.name = event.target.value;
        state.system.inputs[tmp.name] = tmp;
      } else if (state.system.outputs[variable.name] !== undefined) {
        const tmp = state.system.outputs[variable.name];
        delete state.system.outputs[variable.name];
        tmp.name = event.target.value;
        state.system.outputs[tmp.name] = tmp;
      }
    });
  };
  const onMinChange = (event: ChangeEvent<HTMLInputElement>) => {
    stateChange((state: State) => {
      const v = state.system.inputs[variable.name] || state.system.outputs[variable.name];
      v.min = parseInt(event.target.value);
    });
  };
  const onMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    stateChange((state: State) => {
      const v = state.system.inputs[variable.name] || state.system.outputs[variable.name];
      v.max = parseInt(event.target.value);
    });
  };
  const onResolutionChange = (event: ChangeEvent<HTMLInputElement>) => {
    stateChange((state: State) => {
      const v = state.system.inputs[variable.name] || state.system.outputs[variable.name];
      v.resolution = parseInt(event.target.value);
    });
  };
  const [setName, setSetName] = useState("Low");
  const onSetNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSetName(event.target.value);
  }
  const onSetAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    stateChange((state: State) => {
      const v = state.system.inputs[variable.name] || state.system.outputs[variable.name];
      v.addTriangular(setName, 0, 0, 0);
      const tmp = Object.values(v.sets).map(s => s.name);
      v.sets = {};
      v.evenlyDistribute(tmp);
    });
  };
  return <div className="card">
    <div className="card-body">
      <h5 className="card-title">
        <input type="text" name="name" value={variable.name} onChange={onNameChange} />
      </h5>
      <div className="d-flex">
        <label htmlFor="min">Min</label>
        <input type="number" name="min" value={variable.min} onChange={onMinChange} />
        <label htmlFor="max">Max</label>
        <input type="number" name="max" value={variable.max} onChange={onMaxChange} />
        <label htmlFor="resolution">Resolution</label>
        <input type="number" name="resolution" value={variable.resolution} onChange={onResolutionChange} />
      </div>
      <div style={{ width: "500px", height: "300px" }}>
        <canvas ref={chartRef}></canvas>
      </div>
      <input type="text" name="name" value={setName} onChange={onSetNameChange} />
      <button className="btn btn-primary" onClick={onSetAdd}>Add Sets</button>
    </div>
  </div>;
}

interface State {
  system: FuzzySystem
}

export default class FuzzySystemEditor extends React.Component<any, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      system: new FuzzySystem(),
    };
  }

  stateChange = (fn: StateChangeFunction) => {
    this.setState(produce(this.state, fn));
  }

  addInputVariable = () => {
    this.setState(produce(this.state, state => {
      state.system.addInputVariable(new FuzzyVariable("Unnamed Input", 0, 100, 100));
    }));
  }

  addOutputVariable = () => {
    this.setState(produce(this.state, state => {
      state.system.addOutputVariable(new FuzzyVariable("Unnamed Output", 0, 100, 100));
    }));
  }

  addRule = () => {

  }

  render() {
    return <div>
      <h3>Input Variables</h3>
      {Object.values(this.state.system.inputs).map(v => <FuzzyVariableEditor key={v.name} variable={v as any} stateChange={this.stateChange} />)}
      <button className="btn btn-primary" onClick={this.addInputVariable}>Add Variable</button>
      <h3>Output Variables</h3>
      {Object.values(this.state.system.outputs).map(v => <FuzzyVariableEditor key={v.name} variable={v as any} stateChange={this.stateChange} />)}
      <button className="btn btn-primary" onClick={this.addOutputVariable}>Add Variable</button>
      <h3>Rules</h3>
      <button className="btn btn-primary" onClick={this.addRule}>Add Rule</button>
    </div>;
  }
}