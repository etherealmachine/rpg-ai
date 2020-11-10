import React, { useState } from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';

import RoomEditor from './RoomEditor';

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
      width: 400px;
      transition: .2s ease-out;
    }
  }
  .toggleButton {
    position: relative;
    left: -27px;
    background: #373737;
    outline: none;
    border: none;
    font-size: 30px;
    padding: 8px;
    border-radius: 4px 0 0 4px;
  }
`;

export default function Drawer() {
  const [open, setOpen] = useState(true);
  return <div className={classNames(classes.drawer, open && classes.open)}>
    <button
      className={classNames(classes.toggleButton, open && classes.open)}
      onClick={() => setOpen(!open)}>
      {open && <FontAwesomeIcon icon={faCaretRight} />}
      {!open && <FontAwesomeIcon icon={faCaretLeft} />}
    </button>
    <RoomEditor />
  </div>;
}