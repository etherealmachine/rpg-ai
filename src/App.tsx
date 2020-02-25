import React from 'react';
import { createStyles, WithStyles, withStyles } from '@material-ui/core/styles';

import GameState from './dnd5e/GameState';
import Display from './dnd5e/Display';
import Shell from './Shell';
import { Compendium } from './dnd5e/Compendium';

interface AppState {
  game?: GameState;
  displayOnly: boolean;
}

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

class App extends React.Component<WithStyles<typeof styles>, AppState> {

  constructor(props: any) {
    super(props);
    const compendium = new Compendium();
    compendium.load("dnd5e").then(() => {
      const game = new GameState(compendium, this.gameStateChanged.bind(this));
      const storedState = window.localStorage.getItem("gamestate");
      if (storedState) {
        Object.assign(game, JSON.parse(storedState));
      }
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

  gameStateChanged(game: GameState) {
    this.setState({
      ...this.state,
      game: game,
    });
    window.localStorage.setItem("gamestate", JSON.stringify(game));
  }

  render() {
    const { classes } = this.props;
    if (!this.state.game) {
      return <div>Loading...</div>;
    }
    return (
      <div className={classes.app}>
        <div className={classes.display}><Display game={this.state.game} /></div>
        {!this.state.displayOnly && <div className={classes.shell}><Shell program={this.state.game} /></div>}
      </div>
    );
  }
}

export default withStyles(styles)(App);
