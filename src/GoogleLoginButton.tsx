import React from 'react';

import LoginService from './LoginService';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

function googleLoginSuccess(response: GoogleLoginResponse | GoogleLoginResponseOffline) {
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

function googleLoginFailure(response: GoogleLoginResponse | GoogleLoginResponseOffline) {
  console.log(response);
}

export default function GoogleLoginButton() {
  return <GoogleLogin
    className="google-button"
    clientId={`${process.env.REACT_APP_GOOGLE_CLIENT_ID}`}
    buttonText="Login With Google"
    onSuccess={googleLoginSuccess}
    onFailure={googleLoginFailure}
    cookiePolicy={"single_host_origin"}
  />;
}