import React from 'react';
import styled from 'styled-components';

import APIService from './APIService';
import Shell from './Shell';
import GameState from './GameState';
import Phaser from './Phaser';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import FacebookLogin, { ReactFacebookLoginInfo } from 'react-facebook-login';

const api = new APIService(window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

interface AppState {
  game: GameState
  loggedInUsers: string[]
}

class App extends React.Component<{}, AppState> {

  constructor(props: any) {
    super(props);
    this.state = {
      game: new GameState(this.updateGameState.bind(this)),
      loggedInUsers: [],
    };
  }

  updateGameState(game: GameState) {
    this.setState({
      ...this.state,
      game: game,
    });
  }

  googleLoginSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if (response.hasOwnProperty('tokenId')) {
      const googleResponse = (response as GoogleLoginResponse)
      api.googleLogin({ TokenID: googleResponse.tokenId }).then((apiResponse) => {
        if (apiResponse.User.Email === googleResponse.getBasicProfile().getEmail()) {
          this.state.loggedInUsers.push(apiResponse.User.Email);
          this.setState({
            ...this.state,
          });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    }
  }

  googleLoginFailure = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
  }

  facebookLoginResponse = (response: ReactFacebookLoginInfo) => {
    api.facebookLogin({ AccessToken: response.accessToken }).then((apiResponse) => {
      if (apiResponse.User.Email === response.email) {
        this.state.loggedInUsers.push(apiResponse.User.Email);
        this.setState({
          ...this.state,
        });
      }
    }).catch((error: any) => {
      console.log(error);
    });
  }

  render() {
    return <Container>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {this.state.loggedInUsers.join(', ')}
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