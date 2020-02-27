import React from 'react';
import { createStyles, WithStyles, withStyles } from '@material-ui/core/styles';

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

class App extends React.Component<WithStyles<typeof styles>, GameState> {

  constructor(props: any) {
    super(props);
    this.state = new GameState(this.setState.bind(this));
  }

  render() {
    const { classes } = this.props;
    if (this.state.compendium.loaded) {
      return (
        <div className={classes.app}>
          <div className={classes.display}><Display game={this.state} /></div>
          {this.state.mode === 'dm' && <div className={classes.shell}><Shell program={this.state} /></div>}
        </div>
      );
    }
    return <div>Loading...</div>;
  }
}

export default withStyles(styles)(App);