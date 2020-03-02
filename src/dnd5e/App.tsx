import React from 'react';

import Compendium from './Compendium';
import GameState, { GameMode } from './GameState';
import Display from './Display';
import Shell from '../Shell';

interface AppState {
  game?: GameState
}

class App extends React.Component<any, AppState> {

  constructor(props: any) {
    super(props);
    const compendium = new Compendium();
    compendium.load('dnd5e').then(() => {
      let game: GameState;
      if (window.location.search) {
        game = new GameState(GameMode.Player, compendium, this.updateGameState.bind(this));
        game.join(window.location.search.substring(1));
      } else {
        game = new GameState(GameMode.DM, compendium, this.updateGameState.bind(this));
      }
      this.setState({
        game: game,
      });
    });
    this.state = {};
  }

  updateGameState(game: GameState) {
    this.setState({
      game: game,
    });
  }

  render() {
    if (this.state.game?.compendium.loaded) {
      return (
        <div>
          <Display game={this.state.game} />
          {this.state.game.mode === GameMode.DM && <Shell program={this.state.game} />}
        </div>
      );
    }
    return <div>Loading...</div>;
  }
}

export default App;