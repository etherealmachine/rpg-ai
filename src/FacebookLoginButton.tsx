import React from 'react';

import LoginService from './LoginService';
import FacebookLogin, { ReactFacebookLoginInfo } from 'react-facebook-login';


function facebookLoginResponse(response: ReactFacebookLoginInfo) {
  LoginService.FacebookLogin({ AccessToken: response.accessToken }).then(resp => {
    if (resp.User.Email === response.email) {
      window.location.reload();
    }
  }).catch((error: any) => {
    console.log(error);
  });
}

export default function FacebookLoginButton() {
  return <FacebookLogin
    cssClass="facebook-button"
    icon="fa-facebook"
    appId={`${process.env.REACT_APP_FACEBOOK_APP_ID}`}
    fields="email"
    callback={facebookLoginResponse} />;
}