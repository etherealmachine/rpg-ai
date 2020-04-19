import React from 'react';

import DND5E from './dnd5e/App';
import MUD from './mud/App';

interface AppState {
  module: string
}

class App extends React.Component<any, AppState> {

  constructor(props: any) {
    super(props);
    this.state = {
      module: window.location.pathname.replace(/\/app/, '').split('/')[1],
    };
  }

  render() {
    switch (this.state.module) {
      case 'dnd5e':
        return <DND5E />
      case 'mud':
        return <MUD />
      default:
        return <div>{`Module ${this.state.module} not found`}</div>
    }
  }
}

export default App;
