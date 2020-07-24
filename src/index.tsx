import React from 'react';
import ReactDOM from 'react-dom';

import Map from './Map';
import GoogleLoginButton from './GoogleLoginButton';
import FacebookLoginButton from './FacebookLoginButton';
import AssetManager from './AssetManager';
import AssetUploader from './AssetUploader';
import CampaignManager from './CampaignManager';
import CharacterManager from './CharacterManager';
import Encounter from './Encounter';

import { createNanoEvents } from 'nanoevents';
(window as any).emitter = createNanoEvents();

if (window.location.host.startsWith('localhost') && window.location.hash !== "") {
  const demo = document.createElement('div');
  document.body.prepend(demo);
  import('./' + window.location.hash.slice(1)).then(module => {
    ReactDOM.render(React.createElement(module.default), demo);
  }).catch(err => {
    console.error(err);
  })
}

const components = {
  'GoogleLoginButton': GoogleLoginButton,
  'FacebookLoginButton': FacebookLoginButton,
  'Map': Map,
  'AssetManager': AssetManager,
  'AssetUploader': AssetUploader,
  'CampaignManager': CampaignManager,
  'CharacterManager': CharacterManager,
  'Encounter': Encounter,
};

for (let [name, fn] of Object.entries(components)) {
  for (let el of document.getElementsByClassName(name)) {
    const props = JSON.parse(JSON.parse(el.getAttribute("data-props") || "\"{}\""));
    ReactDOM.render(React.createElement(fn as any, props), el);
  }
}