import React, { useState } from 'react';
import { css } from 'astroturf';

import { DS } from './design_system';

const classes = css`
  .menubar {
    display: flex;
    flex-direction: row;
    align-items: center;
    background: #373737;
    padding: 2px;
    width: 100%;
  }
  .title {
    color: white;
    margin: 8px 24px 8px 24px;
  }
`;

export default function Menubar() {
  const [name, setName] = useState('');
  const updateName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }
  return <div className={classes.menubar}>
    <span className={classes.title}>RPG.ai</span>
    <input className={DS.input} value={name} onChange={updateName} />
    <button className={DS.buttonSmall}>Save</button>
    <button className={DS.buttonSmall}>Load</button>
    <button className={DS.buttonSmall}>Undo</button>
    <button className={DS.buttonSmall}>Redo</button>
    <button className={DS.buttonSmall}>Print</button>
    <button
      className={DS.buttonSmall}
      onClick={() => { window.localStorage.removeItem('AppState') }}>
      Clear
    </button>
  </div>;
}