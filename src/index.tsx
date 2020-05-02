import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Navbar from './Navbar';
import AssetUploader from './AssetUploader';

if (document.getElementById('root')) {
  ReactDOM.render(<App />, document.getElementById('root'));
}
if (document.getElementById('navbar')) {
  ReactDOM.render(<Navbar />, document.getElementById('navbar'));
}
if (document.getElementById('asset-uploader')) {
  ReactDOM.render(<AssetUploader />, document.getElementById('asset-uploader'));
}