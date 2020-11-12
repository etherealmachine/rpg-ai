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
  const selectedDesc = appState.selection.geometryIndex ?
    appState.layers[appState.selection.layerIndex].geometries[appState.selection.geometryIndex].description :
    undefined;
  const [name, setName] = useState(selectedDesc ? selectedDesc.name : undefined);
  const [text, setText] = useState(selectedDesc ? selectedDesc.description : undefined);
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
    if (selectedDesc) {
      setName(selectedDesc.name);
      setText(selectedDesc.description);
    }
  };
  const onDeleteClicked = () => {
    appState.setDescription(undefined);
  };
  return <div className={classes.editor}>
    <div style={{ display: 'flex', alignContent: 'center' }}>
      <input className={DS.input} style={{ flexGrow: 1 }} value={name === undefined && selectedDesc ? selectedDesc.name : name} onChange={onNameChange} />
    </div>
    <textarea
      value={text}
      onChange={onTextChange} />
    <div className={classes.actions}>
      {(appState.selection || selectedDesc) && <button className={DS.button} onClick={onSaveClicked}>Save</button>}
      {selectedDesc && <button className={classNames(DS.button)} onClick={onUndoClicked}>Undo</button>}
      {selectedDesc && <button className={classNames(DS.button, DS.danger)} onClick={onDeleteClicked}>Delete</button>}
    </div>
    <Description name={name === undefined ? '' : name} text={text || ''} />
  </div>;
}