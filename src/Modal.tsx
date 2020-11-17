import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext } from 'react';
import { css } from 'astroturf';
import {
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

import { Context } from './State';

const classes = css`
  .modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
  }

  .modalContent {
    position: relative;
    background-color: #373737;
    color: #fff;
    margin: 64px auto;
    padding: 0 20px 20px 20px;
    border: 1px solid #888;
    border-radius: 8px;
    width: 60%;
  }

  .modalContent button {
    outline: none;
    border: none;
    background-color: transparent;
    color: #fff;
    font-size: 24px;
    position: absolute;
    top: 8px;
    right: 8px;
    text-decoration: none;
    cursor: pointer;
  }

  .modalContent h3 {
    margin: 0 0 8px 0;
  }

  .modalContent ul {
    padding: 0;
    margin: 8px 0;
    white-space: nowrap;
  }

  .modalContent li {
    list-style: none;
  }

  .modalContent p {
    padding: 0 40px;
    margin: 8px 0;
  }
`;

const TODO = [
  {
    version: 'Grid-based mapping tool',
    description: 'Goal: Draw a map of a keep with three levels and several rooms.',
    features: {
      'Draw rectangles': true,
      'Draw polygons': true,
      'Draw ovals': true,
      'Paint with brush': true,
      'Zoom and scroll': true,
      'Doors': false,
      'Stairs': false,
      'Set name': false,
      'Multiple levels': false,
      'Save/load': false,
      'Undo/redo': false,
      'Text boxes': false,
      'Describe area': false,
      'Print': false,
    },
  },
  {
    version: 'Extra functionality',
    description: 'Goal: Add NPCs and objects to the map, plus some color esp. for outdoor areas',
    features: {
      'Tokens': false,
      'Objects': false,
      'Secret doors': false,
      'Isometric view': false,
      'Outdoor areas': false,
      'Paintable terrain': false,
    }
  },
  {
    version: 'Fully playable',
    description: 'Goal: Bring 3-4 players together on a shared map that is easy to operate and extend on the fly',
    features: {
      'Invisible creatures': false,
      'Token movement': false,
      'Line of sight': false,
      'NPC database': false,
      'Character sheets': false,
      'NPC interactions': false,
      'Combat mechanics': false,
      'NPC AI': false,
      'Particle effects': false,
      'Hexagonal maps': false,
    },
  }
]

export default function Modal() {
  const state = useContext(Context);
  const handleButtonClick = () => {
    state.toggleModal();
  };
  return <div className={classes.modal} style={{ display: state.modalOpen ? 'block' : 'none' }}>
    <div className={classes.modalContent}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleButtonClick}><FontAwesomeIcon icon={faTimes} /></button>
      </div>
      <h2>TODO List</h2>
      {Object.entries(TODO).map(([version, todos]) => <div key={version}>
        <h3>{todos.version}</h3>
        <div style={{ display: 'flex' }}>
          <ul>
            {Object.entries(todos.features).map(([item, done]) => <li key={item}>
              <input type="checkbox" checked={done} readOnly />
              <span>{item}</span>
            </li>)}
          </ul>
          <p>{todos.description}</p>
        </div>
      </div>)}
    </div>
  </div>;
}