import React, { useContext, useEffect } from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';

import FeatureEditor from './FeatureEditor';
import LevelEditor from './LevelEditor';
import MapEditor from './MapEditor';
import { Context } from './State';
import { useState } from 'react';

const classes = css`
  .drawer {
    width: 0;
    margin: 8px 0;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    background: #373737;
    box-sizing: border-box;
    transition: .2s ease-out;
    &.open {
      transition: .2s ease-out;
      z-index: 100;
    }
  }
  .toggleButton {
    position: absolute;
    top: 0;
    left: -27px;
    background: #373737;
    outline: none;
    border: none;
    font-size: 30px;
    padding: 8px;
    border-radius: 4px 0 0 4px;
  }
  .editors {
    height: 97%;
    overflow: scroll;
    padding: 8px;
  }
`;

export default function Drawer() {
  const appState = useContext(Context);
  const selection = appState.getSelectedFeature();
  const [drag, setDrag] = useState<{ x: number, y: number } | undefined>(undefined);
  const [width, setWidth] = useState(600);
  const onClick = () => {
    appState.toggleDrawer(!appState.drawerOpen);
  }
  const onMouseDown = (e: React.MouseEvent) => {
    setDrag({ x: e.screenX, y: e.screenY });
  }
  const onMouseUp = (e: React.MouseEvent) => {
    setDrag(undefined);
  }
  const onMouseMove = (e: MouseEvent) => {
    if (drag !== undefined && e.buttons !== 1) {
      setDrag(undefined);
      return;
    }
    if (drag !== undefined) {
      setWidth(width + drag.x - e.screenX);
      setDrag({ x: e.screenX, y: e.screenY });
    }
  }
  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
    };
  });
  return <div
    className={classNames(classes.drawer, appState.drawerOpen && classes.open)}
    style={{ width: appState.drawerOpen ? width : 0 }}>
    <button
      className={classNames(classes.toggleButton, appState.drawerOpen && classes.open)}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}>
      {appState.drawerOpen && <FontAwesomeIcon icon={faCaretRight} />}
      {!appState.drawerOpen && <FontAwesomeIcon icon={faCaretLeft} />}
    </button>
    <div className={classes.editors}>
      <MapEditor />
      <LevelEditor />
      {selection && <FeatureEditor />}
    </div>
  </div>;
}