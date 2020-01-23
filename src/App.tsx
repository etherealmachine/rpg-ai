import React from 'react';
import './App.css';

import Connection from './Connection';
import Display from './Display';
import Shell from './Shell';
import Context from './Context';

interface AppState {
  context: Context;
}

class App extends React.Component<any, AppState> {

  constructor(props: any) {
    super(props);
    this.state = {
      context: new Context("dnd5e"),
    };
    this.state.context.setState = this.setState.bind(this);
  }

  render() {
    return (
      <div className="App">
        <Connection />
        <Display context={this.state.context} />
        <Shell context={this.state.context} />
      </div>
    );
  }
}

export default App;
