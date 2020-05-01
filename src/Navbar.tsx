import React from 'react';
import BootstrapNavbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown'

import LoginService, { User } from './LoginService';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import FacebookLogin, { ReactFacebookLoginInfo } from 'react-facebook-login';

const api = new LoginService(window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

interface State {
  user?: User
}

export default class Navbar extends React.Component<{}, State> {

  constructor(props: any) {
    super(props);
    const cookies = document.cookie.split(';').reduce((cookies: any, cookie) => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      cookies[name] = value;
      return cookies;
    }, {});
    if (cookies["internal_user"] !== undefined) {
      console.log(JSON.parse(atob(cookies["internal_user"])));
    }
    this.state = {
      user: cookies["internal_user"] !== undefined ? JSON.parse(atob(cookies["internal_user"])) : undefined,
    };
  }

  googleLoginSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if (response.hasOwnProperty('tokenId')) {
      const googleResponse = (response as GoogleLoginResponse)
      api.googleLogin({ TokenID: googleResponse.tokenId }).then((apiResponse) => {
        if (apiResponse.User.Email === googleResponse.getBasicProfile().getEmail()) {
          this.setState({
            ...this.state,
            user: apiResponse.User,
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
        this.setState({
          ...this.state,
          user: apiResponse.User,
        });
      }
    }).catch((error: any) => {
      console.log(error);
    });
  }

  logout = (event: React.MouseEvent<any, MouseEvent>) => {
    event.preventDefault();
    event.stopPropagation();

    document.cookie = "authenticated_user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "internal_user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "google_user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "facebook_user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    window.location = window.location; // eslint-disable-line no-self-assign
  }

  render() {
    return <BootstrapNavbar className="bg-light justify-content-between" expand="lg">
      <BootstrapNavbar.Brand href="#home">RPG.ai</BootstrapNavbar.Brand>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", alignSelf: "flex-end" }}>
        {(this.state.user !== undefined) &&
          <div>
            <NavDropdown title="Settings" id="settings-dropdown" drop="left">
              {this.state.user && <NavDropdown.Item>{this.state.user.Email}</NavDropdown.Item>}
              <NavDropdown.Item href="#logout" onClick={this.logout}>Logout</NavDropdown.Item>
            </NavDropdown>
          </div>
        }
        {(this.state.user === undefined) &&
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
    </BootstrapNavbar>;
  }
}