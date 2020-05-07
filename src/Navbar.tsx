import React from 'react';

import LoginService, { User } from './LoginService';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import FacebookLogin, { ReactFacebookLoginInfo } from 'react-facebook-login';

interface State {
  User?: User
}

export default class Navbar extends React.Component<State, State> {

  constructor(props: State) {
    super(props);
    this.state = props;
  }

  googleLoginSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if (response.hasOwnProperty('tokenId')) {
      const googleResponse = (response as GoogleLoginResponse)
      LoginService.GoogleLogin({ TokenID: googleResponse.tokenId }).then((resp) => {
        if (resp.User.Email === googleResponse.getBasicProfile().getEmail()) {
          window.location.reload();
        }
      }).catch((error: any) => {
        console.log(error);
      });
    }
  }

  googleLoginFailure = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    console.log(response);
  }

  facebookLoginResponse = (response: ReactFacebookLoginInfo) => {
    LoginService.FacebookLogin({ AccessToken: response.accessToken }).then(resp => {
      if (resp.User.Email === response.email) {
        window.location.reload();
      }
    }).catch((error: any) => {
      console.log(error);
    });
  }

  logout = (event: React.MouseEvent<any, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();
    document.cookie = "authenticated_user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.reload();
  }

  render() {
    return <div className="container">
      <nav className="navbar navbar-expand-lg navbar-light justify-content-between">
        <a className="navbar-brand" href="/">RPG.ai</a>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", alignSelf: "flex-end" }}>
          {this.state.User &&
            <div className="nav-item dropdown">
              <button className="btn btn-link dropdown-toggle" id="navbarDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Settings
            </button>
              <div className="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown">
                {this.state.User && <a href="/profile" className="dropdown-item">{this.state.User.Email}</a>}
                <a className="dropdown-item" href="#logout" onClick={this.logout}>Logout</a>
              </div>
            </div>
          }
          {!this.state.User &&
            <div>
              <GoogleLogin
                className="google-button"
                clientId={`${process.env.REACT_APP_GOOGLE_CLIENT_ID}`}
                buttonText="Login With Google"
                onSuccess={this.googleLoginSuccess}
                onFailure={this.googleLoginFailure}
                cookiePolicy={"single_host_origin"}
              />
              <FacebookLogin
                cssClass="facebook-button"
                icon="fa-facebook"
                appId={`${process.env.REACT_APP_FACEBOOK_APP_ID}`}
                fields="email"
                callback={this.facebookLoginResponse} />
            </div>
          }
        </div>
      </nav>
    </div>;
  }
}