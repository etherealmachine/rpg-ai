import React from 'react';
import styled from 'styled-components';

import Shell from './Shell';
import GameState from './GameState';
import Phaser from './Phaser';

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

interface AppState {
  game: GameState
}

class App extends React.Component<{}, AppState> {

  constructor(props: any) {
    super(props);
    this.state = {
      game: new GameState(this.updateGameState.bind(this)),
    };
  }

  updateGameState(game: GameState) {
    this.setState({
      game: game,
    });
  }

  render() {
    return <Container>
      <div style={{ flex: 1 }}>
        <Phaser game={this.state.game} />
      </div>
      <div style={{ height: "200px" }}>
        <Shell program={this.state.game} />
      </div>
    </Container >;
  }
}

export default App;