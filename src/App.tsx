import React from 'react';
import styled from 'styled-components';

import Shell from './Shell';
import GameState from './GameState';
import Phaser from './Phaser';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import FacebookLogin, { ReactFacebookLoginInfo } from 'react-facebook-login';

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

interface AppState {
  game: GameState
  loggedIn: boolean
}

class App extends React.Component<{}, AppState> {

  constructor(props: any) {
    super(props);
    this.state = {
      game: new GameState(this.updateGameState.bind(this)),
      loggedIn: false,
    };
  }

  updateGameState(game: GameState) {
    this.setState({
      ...this.state,
      game: game,
    });
  }

  googleLoginSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    console.log(response);
    this.setState({
      ...this.state,
      loggedIn: true,
    });
  }

  googleLoginFailure = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    this.setState({
      ...this.state,
      loggedIn: true,
    });
  }

  facebookLoginResponse = (response: ReactFacebookLoginInfo) => {
    console.log(response);
    if (response.email) {
      this.setState({
        ...this.state,
        loggedIn: true,
      });
    } else {
      this.setState({
        ...this.state,
        loggedIn: false,
      });
    }
  }

  render() {
    return <Container>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <GoogleLogin
          className="google-button"
          clientId={`${process.env.REACT_APP_GOOGLE_CLIENT_ID}`}
          buttonText="Login With Google"
          onSuccess={this.googleLoginSuccess}
          onFailure={this.googleLoginFailure}
          cookiePolicy={"single_host_origin"}
          isSignedIn={true}
        />
        <FacebookLogin
          cssClass="facebook-button"
          icon="fa-facebook"
          appId={`${process.env.REACT_APP_FACEBOOK_APP_ID}`}
          fields="email"
          callback={this.facebookLoginResponse} />
      </div>
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