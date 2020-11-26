import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext } from 'react';
import { css } from 'astroturf';
import {
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons'

import { Context } from './State';

const classes = css`
  .navigation {
    display: flex;
    flex-direction: column;
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 8px;
    z-index: 1;
  }
  .navigation svg {
    color: #505050;
    font-size: 24px;
  }
  .navigation button {
    background: transparent;
    outline: none;
    border: none; 
    display: flex;
    margin: 2px;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }
  .navigation button:hover svg {
    color: #000;
  }
`;

export default function Levels() {
  const state = useContext(Context);
  return <div className={classes.navigation}>
    <button onClick={() => state.setZoom(1, [0, 0])}><FontAwesomeIcon icon={faMapMarkerAlt} /></button>
  </div>;
}