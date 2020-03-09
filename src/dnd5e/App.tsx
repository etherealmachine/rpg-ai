import React from 'react';

import Compendium from './Compendium';
import GameState, { GameMode } from './GameState';
import DMDisplay from './DMDisplay';
import InitiativeDisplay from './InitiativeDisplay';

interface AppState {
  game?: GameState
  display: string
}

function parse(query: string) {
  const params: { [key: string]: string } = {};
  const pairs = (query[0] === '?' ? query.substr(1) : query).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return params;
}

class App extends React.Component<any, AppState> {

  constructor(props: any) {
    super(props);
    const compendium = new Compendium();
    const params = parse(window.location.search);
    compendium.load('dnd5e').then(() => {
      let game: GameState;
      if (params["session"]) {
        game = new GameState(GameMode.Player, compendium, this.updateGameState.bind(this));
        console.log(params["session"]);
        game.join(params["session"]);
      } else {
        game = new GameState(GameMode.DM, compendium, this.updateGameState.bind(this));
      }
      this.setState({
        game: game,
      });
    });
    this.state = {
      display: params["display"],
    };
  }

  updateGameState(game: GameState) {
    this.setState({
      game: game,
    });
  }

  render() {

    if (this.state.game?.compendium.loaded) {
      switch (this.state.display) {
        case "map":
        case "initiative":
          return <InitiativeDisplay game={this.state.game} />;
        default:
          if (this.state.game.mode === GameMode.DM) {
            return <DMDisplay game={this.state.game} />;
          }
          return <InitiativeDisplay game={this.state.game} />;
      }
    }
    return <div>Loading...</div>;
  }
}

export default App;