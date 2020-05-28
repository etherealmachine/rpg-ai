import React, { useEffect, useRef } from 'react';
import produce from 'immer';
import Chart, { ChartConfiguration } from 'chart.js';

import { FuzzyVariable, FuzzyRule, FuzzySystem } from './rules/FuzzyLogic';
import { Rules } from './rules/Rules';

const backgroundColors = {
  2: [
    'rgba(255, 60, 0, 0.8)',
    'rgba(84, 255, 0, 0.8)',
  ],
  3: [
    'rgba(255, 60, 0, 0.8)',
    'rgba(255, 191, 0, 0.8)',
    'rgba(84, 255, 0, 0.8)',
  ],
  4: [
    'rgba(255, 60, 0, 0.8)',
    'rgba(255, 132, 0, 0.8)',
    'rgba(255, 242, 0, 0.8)',
    'rgba(84, 255, 0, 0.8)',
  ],
  5: [
    'rgba(255, 60, 0, 0.8)',
    'rgba(255, 132, 0, 0.8)',
    'rgba(255, 191, 0, 0.8)',
    'rgba(255, 242, 0, 0.8)',
    'rgba(192, 255, 0, 0.8)',
    'rgba(84, 255, 0, 0.8)',
  ],
};

function chart(v: FuzzyVariable, crisp: number): ChartConfiguration {
  return {
    type: 'line',
    data: {
      datasets: Object.values(v.sets).map((set, i) => ({
        label: set.name,
        data: set.membership.map((v, i) => ({ x: i, y: v })).filter(point => point.y > 0),
        backgroundColor: (backgroundColors as any)[Object.values(v.sets).length][i],
        lineTension: 0,
        spanGaps: true,
      })),
    },
    options: {
      animation: {
        duration: 0,
      },
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
      },
    },
    plugins: [{
      afterDraw: function (chart: Chart, easing: unknown) {
        const x = (chart as any).scales['x-axis-0'].getPixelForValue(crisp);
        const y0 = (chart as any).scales['y-axis-0'].getPixelForValue(0);
        const y1 = (chart as any).scales['y-axis-0'].getPixelForValue(1);
        const context = chart.ctx;
        if (context === null) return;
        context.beginPath();
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.moveTo(x, y0);
        context.lineTo(x, y1);
        context.stroke();
      }
    }]
  };
}

function FuzzyRuleUI(props: { rule: FuzzyRule }) {
  const { rule } = props;
  const antecedent = Object.entries(rule.antecedent).map(([variableName, setName]) => `${variableName} is ${setName}`).join(' and ');
  const consequence = Object.entries(rule.consequence).map(([variableName, setName]) => `${variableName} is ${setName}`).join(' and ');
  return <span>{`If ${antecedent} then ${consequence}`}</span>;
}

function FuzzyVariableUI(props: { variable: FuzzyVariable, crispValue: number, updateCrispValue?: (value: number) => void }) {
  const { variable, crispValue, updateCrispValue } = props;
  const chartRef = useRef(null);
  useEffect(() => {
    const el = (chartRef.current as HTMLCanvasElement | null);
    if (el === null) return;
    const ctx = el.getContext('2d');
    if (ctx === null) return;
    if ((el as any).chart !== undefined) {
      (el as any).chart.config = chart(variable, crispValue);
      (el as any).chart.update();
      return;
    }
    (el as any).chart = new Chart(ctx, chart(variable, crispValue));
  });
  return <div className="card">
    <div className="card-body">
      <h5 className="card-title">
        {variable.name}
      </h5>
      <div style={{ width: "500px" }}>
        <canvas ref={chartRef}></canvas>
      </div>
      {updateCrispValue && <input
        style={{ marginLeft: "25px", width: "475px" }}
        type="range"
        min={variable.min}
        max={variable.max}
        step={(variable.max - variable.min) / variable.resolution}
        value={crispValue}
        onChange={event => { updateCrispValue(parseInt(event.target.value)); }} />}
    </div>
  </div>;
}

interface State {
  system: FuzzySystem
  inputValue: { [key: string]: number }
  updateInputValue: { [key: string]: (v: number) => void }
  outputValue: { [key: string]: number }
}

export default class FuzzySystemUI extends React.Component<any, State> {

  constructor(props: any) {
    super(props);
    const system = new Rules().system;
    const inputValue: { [key: string]: number } = {};
    const updateInputValue: { [key: string]: (v: number) => void } = {};
    Object.entries(system.inputs).forEach(([name, variable]) => {
      inputValue[name] = variable.min;
      updateInputValue[name] = this.updateInputValue(name).bind(this);
    });
    this.state = {
      system: system,
      inputValue: inputValue,
      updateInputValue: updateInputValue,
      outputValue: system.evaluate(inputValue),
    };
  }

  updateInputValue = (name: string) => (v: number) => {
    this.setState(produce(this.state, state => {
      state.inputValue[name] = v;
      state.outputValue = this.state.system.evaluate(this.state.inputValue);
    }));
  }

  render() {
    return <div>
      <h3>Input Variables</h3>
      <div className="d-flex">
        {Object.values(this.state.system.inputs).map(v => <FuzzyVariableUI
          key={v.name}
          variable={v as any}
          crispValue={this.state.inputValue[v.name]}
          updateCrispValue={this.state.updateInputValue[v.name]} />)}
      </div>
      <h3>Output Variables</h3>
      <div className="d-flex">
        {Object.values(this.state.system.outputs).map(v => <FuzzyVariableUI
          key={v.name}
          variable={v as any}
          crispValue={this.state.outputValue[v.name]} />)}
      </div>
      <h3>Rules</h3>
      <div className="d-flex flex-column">
        {Object.values(this.state.system.rules).map((r, i) => <FuzzyRuleUI key={`rule-${i}`} rule={r as any} />)}
      </div>
    </div>;
  }
}