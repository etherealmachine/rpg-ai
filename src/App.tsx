import React from 'react';
import './App.css';

import GameState from './dnd5e/GameState';
import Display from './dnd5e/Display';
import Shell from './Shell';
import { Compendium } from './dnd5e/Compendium';

interface AppState {
  game?: GameState;
  displayOnly: boolean;
}

class App extends React.Component<any, AppState> {

  constructor(props: any) {
    super(props);
    const compendium = new Compendium();
    compendium.load("dnd5e").then(() => {
      const game = new GameState(compendium, () => {
        this.setState({
          ...this.state,
          game: game,
        });
      });
      this.setState({
        game: game,
        displayOnly: window.location.search !== '',
      });
      if (window.location.search) {
        game.join(window.location.search.slice(1));
      }
    });
    this.state = {
      displayOnly: true,
    };
  }

  render() {
    if (!this.state.game) {
      return <div>Loading...</div>;
    }
    return (
      <div className="App">
        <Display game={this.state.game} />
        {!this.state.displayOnly && <Shell program={this.state.game} />}
      </div>
    );
  }
}

export default App;
