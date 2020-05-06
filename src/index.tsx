import React from 'react';
import ReactDOM from 'react-dom';

import Map from './Map';
import Navbar from './Navbar';
import AssetTable from './AssetTable';
import AssetUploader from './AssetUploader';

if (window.location.host.startsWith('localhost') && window.location.hash !== "") {
  import('./' + window.location.hash.slice(1)).then(module => {
    ReactDOM.render(React.createElement(module.default), document.getElementById('demo'));
  }).catch(err => {
    console.error(err);
  })
}

const components = {
  'Navbar': Navbar,
  'Map': Map,
  'AssetTable': AssetTable,
  'AssetUploader': AssetUploader,
};

for (let [name, fn] of Object.entries(components)) {
  for (let el of document.getElementsByClassName(name)) {
    const props = JSON.parse(JSON.parse(el.getAttribute("data-props") || "\"{}\""));
    ReactDOM.render(React.createElement(fn as any, props), el);
  }
}