/*
  RPG.ai brings Table Top Role Playing Games to the next level

  RPG.ai lets you easily draw beautiful maps full of NPCs, object, and areas for players to explore.

  TODO:
    [x] After drag end, apply selected rect with brush or eraser, or keep as selection for later.
    [.] Polygons
    [.] Ovals
    [x] Zoom
    [x] Scroll
    [.] Set name
    [.] Save
    [.] Load
    [.] Undo
    [.] Redo
    [.] Text boxes
    [.] Stairs
    [.] Doors
    [.] Annotate areas
    [ ] Tokens
    [ ] Objects
    [ ] Secret doors
    [ ] Isometric view
    [ ] Multi-Level maps
    [ ] Invisible creatures
    [ ] Paintable terrain
    [ ] Token movement
    [ ] Line of sight
    [ ] NPC database
    [ ] Character sheets
    [ ] NPC interactions
    [ ] Combat mechanics
    [ ] NPC AI
    [ ] Particle effects
    [ ] Print to PDF
*/
import React from 'react';
import { css } from 'astroturf';

import Canvas from './Canvas';
import Drawer from './Drawer';
import Toolbar from './Toolbar';
import Menubar from './Menubar';
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
  const [state, setState] = useLocalStorageState('AppState', new State());
  state.setState = setState;
  return (
    <div className={classes.app}>
      <Context.Provider value={state}>
        <Menubar />
        <div className={classes.canvasWrapper}>
          <Canvas />
          <Drawer />
          <Toolbar />
        </div>
      </Context.Provider>
    </div>
  );
}
