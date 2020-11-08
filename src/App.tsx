/*
  RPG.ai brings Table Top Role Playing Games to the next level

  RPG.ai lets you easily draw beautiful maps full of NPCs, object, and areas for players to explore.

  TODO:
    [x] After drag end, apply selected rect with brush or eraser, or keep as selection for later.
    [ ] Polygons
    [ ] Ovals
    [x] Zoom
    [x] Scroll
    [ ] Set name
    [ ] Save
    [ ] Load
    [ ] Text boxes
    [ ] Stairs
    [ ] Doors
    [ ] Annotate areas
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
import Toolbar from './Toolbar';
import Menubar from './Menubar';
import { Context, initialState } from './State';
import { useLocalStorageState } from './Persistence';

const classes = css`
  .app {
    width: 100vw;
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
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
