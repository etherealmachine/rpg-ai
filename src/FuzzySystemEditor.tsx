import React, { useState } from 'react';
import styled from 'styled-components';

import { FuzzyVariable, FuzzyRule, FuzzySystem } from './rules/FuzzyLogic';

interface State {
  variables: FuzzyVariable[]
  system: FuzzySystem
}

function FuzzyVariableEditor(v: FuzzyVariable) {
  return <div className="card">
    <div className="card-body">
      <h5 className="card-title">
        <input type="text" name="name" value={v.name} />
      </h5>
      <div className="d-flex">
        <label htmlFor="min">Min</label>
        <input type="number" name="min" value={v.min} />
        <label htmlFor="max">Max</label>
        <input type="number" name="max" value={v.max} />
        <label htmlFor="resolution">Resolution</label>
        <input type="number" name="resolution" value={v.resolution} />
      </div>
      <div className="d-flex">
        {Object.entries(v.sets).map(([name, set]) => {
          return <span>{name}</span>;
        })}
      </div>
    </div>
  </div>;
}

export default class FuzzySystemEditor extends React.Component<any, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      variables: [],
      system: new FuzzySystem(),
    };
  }

  render() {
    const newVariable = new FuzzyVariable("Unnamed", 0, 100, 100);
    return <div>
      <h3>Variables</h3>
      <FuzzyVariableEditor {...newVariable as any} />
      <button className="btn btn-primary">Add Variable</button>
      <h3>Rules</h3>
      <button className="btn btn-primary">Add Rule</button>
    </div>;
  }
}