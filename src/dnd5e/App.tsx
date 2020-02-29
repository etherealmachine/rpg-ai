import React from 'react';
import { createStyles, WithStyles, withStyles } from '@material-ui/core/styles';

import Compendium from './Compendium';
import GameState, { GameMode } from './GameState';
import Display from './Display';
import Shell from '../Shell';

const styles = createStyles({
  app: {
    height: '100%',
  },
  display: {
    height: '60%',
  },
  shell: {
    height: '40%',
  },
});

interface AppState {
  game?: GameState
}

class App extends React.Component<WithStyles<typeof styles>, AppState> {

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
    const { classes } = this.props;
    if (this.state.game?.compendium.loaded) {
      return (
        <div className={classes.app}>
          <div className={classes.display}><Display game={this.state.game} /></div>
          {this.state.game.mode === GameMode.DM && <div className={classes.shell}><Shell program={this.state.game} /></div>}
        </div>
      );
    }
    return <div>Loading...</div>;
  }
}

export default withStyles(styles)(App);