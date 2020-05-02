import React from 'react';

import AssetService, { Asset } from './AssetService';
import { User } from './LoginService';

const api = new AssetService(window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api');

interface State {
  user?: User
}

export default class AssetUploader extends React.Component<{}, State> {

  fileInput: React.RefObject<HTMLInputElement> = React.createRef()

  onFileLoad = (event: ProgressEvent<FileReader>) => {
    const buf = event.target?.result;
    if (buf) {
      console.log(JSON.parse(buf as string));
    }
  }

  onUploadClicked = (event: React.MouseEvent) => {
    const files = (this.fileInput.current as any).files as FileList;
    var fileReader = new FileReader();
    fileReader.onload = this.onFileLoad

    for (let file of files) {
      if (file.name.endsWith('.json')) {
        fileReader.readAsText(file, "UTF-8");
      }
    }

    event.preventDefault();
  }

  onFilesChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log((this.fileInput.current as any).files);
  }

  render() {
    return <form>
      <input
        type="file"
        id="files"
        name="files[]"
        ref={this.fileInput}
        onChange={this.onFilesChanged}
        multiple />
      <button onClick={this.onUploadClicked}>Upload</button>
    </form>;
  }
}