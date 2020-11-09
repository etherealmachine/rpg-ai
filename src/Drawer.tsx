import React, { useState } from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { sanitize } from 'dompurify';
import marked from 'marked';

const classes = css`
  .drawer {
    width: 0;
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    background: #373737;
    &.open {
      width: 400px;
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
    &.open {

    }
  }
  .content {
    display: flex;
    flex-direction: column;
  }
  .content textarea {
    height: 400px;
  }
  .formattedText {
    padding: 8px;
  }
`;

export default function Drawer() {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');
  const onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  }
  return <div className={classNames(classes.drawer, open && classes.open)}>
    <button
      className={classNames(classes.toggleButton, open && classes.open)}
      onClick={() => setOpen(!open)}>
      {open && <FontAwesomeIcon icon={faCaretRight} />}
      {!open && <FontAwesomeIcon icon={faCaretLeft} />}
    </button>
    <div className={classes.content}>
      <textarea
        value={text}
        onChange={onTextChange} />
      <div
        className={classes.formattedText}
        dangerouslySetInnerHTML={{ __html: sanitize(marked(text)) }} />
    </div>
  </div >;
}