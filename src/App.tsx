import React from 'react';
import './App.css';
import { SnackbarProvider } from 'notistack';

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
    this.state.context.onChange((context) => {
      this.setState({
        ...this.state,
        context: context,
      });
    });
  }

  render() {
    return (
      <SnackbarProvider maxSnack={3}>
        <div className="App">
          <Connection context={this.state.context} />
          <Display context={this.state.context} />
          <Shell context={this.state.context} />
        </div>
      </SnackbarProvider>
    );
  }
}

export default App;
