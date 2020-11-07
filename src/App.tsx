/*
  Features:
*/
import React, { useState } from 'react';
import { css } from 'astroturf';

import Canvas from './Canvas';
import Toolbar from './Toolbar';
import { Context, initialState } from './State';

const classes = css`
  .app {
    width: 100vw;
    height: 100vh;
    position: relative;
  }
`;

export default function App() {
  const [state, setState] = useState(initialState);
  return (
    <div className={classes.app}>
      <Context.Provider value={{ ...state, setState: setState }}>
        <Canvas />
        <Toolbar />
      </Context.Provider>
    </div>
  );
}
