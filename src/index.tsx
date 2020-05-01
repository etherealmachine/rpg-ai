import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Navbar from './Navbar';

if (document.getElementById('root')) {
  ReactDOM.render(<App />, document.getElementById('root'));
}
if (document.getElementById('navbar')) {
  ReactDOM.render(<Navbar />, document.getElementById('navbar'));
}
