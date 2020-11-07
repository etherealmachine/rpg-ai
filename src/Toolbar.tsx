import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext } from 'react';
import { css } from 'astroturf';
import {
  faMousePointer,
  faVectorSquare,
  faDrawPolygon,
  faCircle,
  faBrush,
  faEraser,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons'

import { Context, setSelectedTool } from './State';

const classes = css`
  .toolbar {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
    background: #000;
    border-radius: 12px;
    margin-top: 50px;
    margin-left: 24px;
    padding: 8px;
    box-shadow: 4px 4px 6px rgba(0, 0, 0, 0.2);
  }
  .toolbar svg {
    color: white;
    font-size: 24px;
  }
  .toolbar .selected svg {
    color: black;
  }
  .toolbar button {
    background: transparent;
    width: 50px;
    height: 50px;
    border: 1px solid white;
    outline: none;
    margin: 4px;
  }
  .toolbar > button:hover {
    box-shadow: -2px -2px 8px rgba(255, 255, 255, 0.9), 2px 2px 8px rgba(255, 255, 255, 0.9);
  }
  .toolbar > button:active {
    outline: none;
    border: none;
    scale: 0.9;
  }
  .toolbar button.selected {
    background: #bbb;
    box-shadow: -1px -1px 8px rgba(255, 255, 255, 0.5), 1px 1px 8px rgba(255, 255, 255, 0.5);
  }
`;

const icons: { [key: string]: IconDefinition } = {
  'pointer': faMousePointer,
  'brush': faBrush,
  'box': faVectorSquare,
  'polygon': faDrawPolygon,
  'circle': faCircle,
  'eraser': faEraser,
};

export default function Toolbar() {
  const state = useContext(Context);
  const handleButtonClick = (tool: string) => () => {
    setSelectedTool(state, tool);
  };
  return <div className={classes.toolbar}>
    {Object.entries(state.tools).map(([name, spec]) => <button
      key={name}
      className={spec.selected ? classes.selected : ''}
      onClick={handleButtonClick(name)}>
      <FontAwesomeIcon icon={icons[name]} />
    </button>)}
  </div>;
}