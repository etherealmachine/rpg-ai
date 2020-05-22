import React, { ChangeEvent, useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js';

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

function chart(v: FuzzyVariable): ChartConfiguration {
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

function FuzzyRuleUI(props: { rule: FuzzyRule }) {
  const { rule } = props;
  const antecedent = Object.entries(rule.antecedent).map(([variableName, setName]) => `${variableName} is ${setName}`).join(' and ');
  const consequence = Object.entries(rule.consequence).map(([variableName, setName]) => `${variableName} is ${setName}`).join(' and ');
  return <span>{`If ${antecedent} then ${consequence}`}</span>;
}

function FuzzyVariableUI(props: { variable: FuzzyVariable }) {
  const { variable } = props;
  const chartRef = useRef(null);
  useEffect(() => {
    const el = (chartRef.current as HTMLCanvasElement | null);
    if (el === null) return;
    const ctx = el.getContext('2d');
    if (ctx === null) return;
    if ((el as any).chart !== undefined) {
      (el as any).chart.config = chart(variable);
      (el as any).chart.update();
      return;
    }
    (el as any).chart = new Chart(ctx, chart(variable));
  });
  return <div className="card">
    <div className="card-body">
      <h5 className="card-title">
        {variable.name}
      </h5>
      <div style={{ width: "500px" }}>
        <canvas ref={chartRef}></canvas>
      </div>
      <input
        style={{ width: "500px" }}
        type="range"
        min={variable.min}
        max={variable.max}
        step={(variable.max - variable.min) / variable.resolution} />
    </div>
  </div>;
}

interface State {
  system: FuzzySystem
}

export default class FuzzySystemUI extends React.Component<any, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      system: new Rules().system,
    };
  }

  render() {
    return <div>
      <h3>Input Variables</h3>
      <div className="d-flex">
        {Object.values(this.state.system.inputs).map(v => <FuzzyVariableUI key={v.name} variable={v as any} />)}
      </div>
      <h3>Output Variables</h3>
      <div className="d-flex">
        {Object.values(this.state.system.outputs).map(v => <FuzzyVariableUI key={v.name} variable={v as any} />)}
      </div>
      <h3>Rules</h3>
      <div className="d-flex flex-column">
        {Object.values(this.state.system.rules).map((r, i) => <FuzzyRuleUI key={`rule-${i}`} rule={r as any} />)}
      </div>
    </div>;
  }
}