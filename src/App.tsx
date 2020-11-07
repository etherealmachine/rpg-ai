/*
  Features:
*/
import React from 'react';
import { css } from 'astroturf';

import Canvas from './Canvas';
import Toolbar from './Toolbar';
import Menubar from './Menubar';
import { Context, initialState } from './State';
import { useLocalStorageState } from './Persistence';

const classes = css`
  .app {
    width: 100vw;
    height: 100vh;
    position: relative;
  }
`;

export default function App() {
  const [state, setState] = useLocalStorageState('AppState', initialState);
  return (
    <div className={classes.app}>
      <Context.Provider value={{ ...state, setState: setState }}>
        <Menubar />
        <Canvas />
        <Toolbar />
      </Context.Provider>
    </div>
  );
}
