import React from 'react';

import Compendium from './Compendium';
import GameState, { GameMode } from './GameState';
import DMDisplay from './DMDisplay';
import PlayerDisplay from './PlayerDisplay';

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
      return (this.state.game.mode === GameMode.DM ? <DMDisplay game={this.state.game} /> : <PlayerDisplay game={this.state.game} />);
    }
    return <div>Loading...</div>;
  }
}

export default App;