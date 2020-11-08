import React from 'react';
import { css } from 'astroturf';

const classes = css`
  .menubar {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    background: #373737;
    padding: 2px;
    width: 100%;
  }
  .menubar button {
    background: transparent;
    border: 1px solid white;
    outline: none;
    margin: 4px;
    color: white;
    font-size: 18px;
    font-weight: 600;
    box-sizing: border-box;
  }
  .menubar > button:hover {
    box-shadow: -1px -1px 8px rgba(255, 255, 255, 0.9), 1px 1px 8px rgba(255, 255, 255, 0.9);
  }
  .menubar > button:active {
    outline: none;
    box-shadow: -3px -3px 8px rgba(255, 255, 255, 0.9), 3px 3px 8px rgba(255, 255, 255, 0.9);
  }
  .title {
    color: white;
    margin: 8px 24px 8px 24px;
  }
`;

export default function Menubar() {
  return <div className={classes.menubar}>
    <span className={classes.title}>RPG.ai</span>
    <button>Save</button>
    <button>Load</button>
    <button>Undo</button>
    <button>Redo</button>
  </div>;
}