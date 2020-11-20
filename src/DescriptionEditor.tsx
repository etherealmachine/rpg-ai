import React, { useContext, useState } from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';

import { DS } from './design_system';
import * as State from './State';
import Description from './Description';

const classes = css`
  .editor {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .editor textarea {
    height: 400px;
    outline: none;
    border: none;
  }
  .name {
    font-family: Helvetica serif;
    font-size: 24px;
    color: white;
    padding: 8px;
  }
  .actions {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    overflow: hidden;
    margin: 12px 24px;
  }
`;

export default function DescriptionEditor() {
  const appState = useContext(State.Context);
  const selectedFeature = appState.selection.featureIndex ?
    appState.levels[appState.selection.layerIndex].features[appState.selection.featureIndex] :
    undefined;
  const properties = selectedFeature?.properties;
  const [name, setName] = useState(properties ? properties['name'] : undefined);
  const [text, setText] = useState(properties ? properties['description'] : undefined);
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  const onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };
  const onSaveClicked = () => {
    appState.setDescription({
      name: name || '',
      description: text || '',
    });
  };
  const onUndoClicked = () => {
    if (properties) {
      setName(properties['name']);
      setText(properties['description']);
    }
  };
  const onDeleteClicked = () => {
    appState.setDescription(undefined);
  };
  return <div className={classes.editor}>
    <div style={{ display: 'flex', alignContent: 'center' }}>
      <input className={DS.input} style={{ flexGrow: 1 }} value={name === undefined && properties ? properties['name'] : name} onChange={onNameChange} />
    </div>
    <textarea
      value={text}
      onChange={onTextChange} />
    <div className={classes.actions}>
      {(appState.selection || properties) && <button className={DS.button} onClick={onSaveClicked}>Save</button>}
      {properties && <button className={classNames(DS.button)} onClick={onUndoClicked}>Undo</button>}
      {properties && <button className={classNames(DS.button, DS.danger)} onClick={onDeleteClicked}>Delete</button>}
    </div>
    <Description name={name === undefined ? '' : name} text={text || ''} />
  </div>;
}