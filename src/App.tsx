/*
  RPG.ai brings Table Top Role Playing Games to the next level

  RPG.ai lets you easily draw beautiful maps full of NPCs, object, and areas for players to explore.
*/
import React, { useState } from 'react';
import { css } from 'astroturf';

import Canvas from './Canvas';
import Drawer from './Drawer';
import Toolbar from './Toolbar';
import Menubar from './Menubar';
import Modal from './Modal';
import TODO from './TODO';
import { Context, State } from './State';
import { useLocalStorageState } from './Persistence';

const classes = css`
  .app {
    width: 100vw;
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .canvasWrapper {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
  }
`;

export default function App() {
  const [i, setCount] = useState(0);
  const [state, setState] = useLocalStorageState('AppState', new State());
  state.setState = (newState: State) => {
    setState(newState);
    setCount(i + 1);
  };
  return (
    <div className={classes.app}>
      <Context.Provider value={state}>
        <Menubar />
        <div className={classes.canvasWrapper}>
          <Modal open={state.showTodo} toggle={state.toggleTodo.bind(state)}><TODO /></Modal>
          <Canvas />
          <Drawer />
          <Toolbar />
        </div>
      </Context.Provider>
    </div>
  );
}