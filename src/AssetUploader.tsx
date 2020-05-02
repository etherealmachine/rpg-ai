import React from 'react';

import AssetService, { Asset } from './AssetService';
import { User } from './LoginService';

const api = new AssetService(window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

interface State {
  user?: User
}

export default class AssetUploader extends React.Component<{}, State> {

  render() {
    return <form>
      <input type="file" id="files" name="files[]" multiple></input>
      <button>Upload</button>
    </form>;
  }
}