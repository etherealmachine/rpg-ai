import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext } from 'react';
import { css } from 'astroturf';

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
  }
  .toolbar svg {
    color: white;
    font-size: 24px;
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
  .selected {
    box-shadow: -1px -1px 8px rgba(255, 255, 255, 0.5), 1px 1px 8px rgba(255, 255, 255, 0.5);
  }
`;

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
      <FontAwesomeIcon icon={spec.icon} />
    </button>)}
  </div>;
}