import React from 'react';
import { createStyles, WithStyles, withStyles } from '@material-ui/core/styles';

import Compendium from './Compendium';
import GameState from './GameState';
import Display from './Display';
import Shell from '../Shell';

const styles = createStyles({
  app: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'auto',
  },
  display: {
    height: '100%',
    flex: 4,
  },
  shell: {
    height: '100%',
    flex: 3,
  },
});

interface AppState {
  game?: GameState
}

class App extends React.Component<WithStyles<typeof styles>, AppState> {

  constructor(props: any) {
    super(props);
    const compendium = new Compendium();
    compendium.load('dnd5e').then(() => this.setState({
      game: new GameState(compendium, this.updateGameState.bind(this)),
    }));
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
          {this.state.game.mode === 'dm' && <div className={classes.shell}><Shell program={this.state.game} /></div>}
        </div>
      );
    }
    return <div>Loading...</div>;
  }
}

export default withStyles(styles)(App);