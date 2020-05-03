import React from 'react';

import LoginService, { User } from './LoginService';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import FacebookLogin, { ReactFacebookLoginInfo } from 'react-facebook-login';

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
    this.state = {
      user: cookies["internal_user"] !== undefined ? JSON.parse(atob(cookies["internal_user"])) : undefined,
    };
  }

  googleLoginSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if (response.hasOwnProperty('tokenId')) {
      const googleResponse = (response as GoogleLoginResponse)
      LoginService.googleLogin({ TokenID: googleResponse.tokenId }).then((apiResponse) => {
        if (apiResponse.User.Email === googleResponse.getBasicProfile().getEmail()) {
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
    LoginService.facebookLogin({ AccessToken: response.accessToken }).then((apiResponse) => {
      if (apiResponse.User.Email === response.email) {
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
    document.cookie = "internal_user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "google_user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "facebook_user= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.reload();
  }

  render() {
    return <nav className="navbar navbar-expand-lg navbar-light bg-light justify-content-between">
      <a className="navbar-brand" href="#home">RPG.ai</a>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", alignSelf: "flex-end" }}>
        {(this.state.user !== undefined) &&
          <div className="nav-item dropdown">
            <button className="btn btn-link dropdown-toggle" id="navbarDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Settings
            </button>
            <div className="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown">
              {this.state.user && <a href="/profile" className="dropdown-item">{this.state.user.Email}</a>}
              <a className="dropdown-item" href="#logout" onClick={this.logout}>Logout</a>
            </div>
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
    </nav>;
  }
}