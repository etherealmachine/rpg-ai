import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Navbar from './Navbar';
import AssetTable from './AssetTable';
import AssetUploader from './AssetUploader';

if (document.getElementById('root')) {
  if (window.location.host.startsWith('localhost') && window.location.hash !== "") {
    import('./' + window.location.hash.slice(1)).then(module => {
      ReactDOM.render(React.createElement(module.default), document.getElementById('root'));
    }).catch(err => {
      console.error(err);
    })
  } else {
    ReactDOM.render(<App />, document.getElementById('root'));
  }
}
if (document.getElementById('navbar')) {
  ReactDOM.render(<Navbar />, document.getElementById('navbar'));
}
if (document.getElementById('asset-uploader')) {
  ReactDOM.render(<AssetUploader />, document.getElementById('asset-uploader'));
}
const node = document.getElementById('asset-table');
if (node) {
  const props = JSON.parse(JSON.parse(node.getAttribute("data-props") || ""));
  ReactDOM.render(<AssetTable {...props} />, node);
}