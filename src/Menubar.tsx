import React, { useContext, useState } from 'react';
import { css } from 'astroturf';

import { DS } from './design_system';
import { Context } from './State';

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
  .debugMenu {
    margin-left: auto;
    margin-right: 24px;
  }
  label {
    color: white;
  }
`;

export default function Menubar() {
  const appState = useContext(Context);
  const [name, setName] = useState('');
  const updateName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }
  return <div className={classes.menubar}>
    <span className={classes.title}>RPG.ai</span>
    <input className={DS.input} value={name} onChange={updateName} />
    <button
      className={DS.buttonSmall}
      onClick={() => { appState.newMap(); }}>
      New
    </button>
    {appState.debug &&
      <button
        className={DS.buttonSmall}
        onClick={() => { appState.reset(); }}>
        Clear
      </button>}
    <div className={classes.debugMenu}>
      <label>Debug</label>
      <input
        type="checkbox"
        checked={appState.debug}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => appState.setDebug(event.target.checked)} />
    </div>
  </div>;
}