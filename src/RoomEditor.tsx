import React, { useContext, useState } from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';

import { DS } from './design_system';
import { addRoomDescription, Context, deleteRoom, updateRoom } from './State';
import RoomDescription from './RoomDescription';

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
  .roomName {
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

export default function RoomEditor() {
  const appState = useContext(Context);
  const selectedIndex = appState.roomDescriptions.findIndex(desc => desc.selected);
  const selectedRoom = appState.roomDescriptions[selectedIndex];
  const [currIndex, setCurrIndex] = useState(selectedIndex !== undefined ? selectedIndex : undefined);
  const [name, setName] = useState(selectedRoom ? selectedRoom.name : undefined);
  const [text, setText] = useState(selectedRoom ? selectedRoom.description : undefined);
  if (selectedIndex !== currIndex) {
    if (selectedIndex === -1) {
      setName('');
      setText('');
    } else {
      setName(selectedRoom.name);
      setText(selectedRoom.description);
    }
    setCurrIndex(selectedIndex);
  }
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  const onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };
  const onSaveClicked = () => {
    if (appState.selection) {
      addRoomDescription(appState, {
        name: name || '',
        description: text || '',
        shape: appState.selection,
        selected: true,
      });
    } else if (selectedRoom) {
      updateRoom(appState, selectedIndex, {
        ...selectedRoom,
        name: name || '',
        description: text || '',
      });
    }
  };
  const onUndoClicked = () => {
    setName(selectedRoom.name);
    setText(selectedRoom.description);
  };
  const onDeleteClicked = () => {
    deleteRoom(appState, selectedIndex);
  };
  const roomNo = selectedRoom ? selectedIndex + 1 : appState.selection ? appState.roomDescriptions.length + 1 : '?';
  return <div className={classes.editor}>
    <div style={{ display: 'flex', alignContent: 'center' }}>
      <div className={classes.roomName}>Room {roomNo}:</div>
      <input className={DS.input} style={{ flexGrow: 1 }} value={name === undefined && selectedRoom ? selectedRoom.name : name} onChange={onNameChange} />
    </div>
    <textarea
      value={text}
      onChange={onTextChange} />
    <div className={classes.actions}>
      {(appState.selection || selectedRoom) && <button className={DS.button} onClick={onSaveClicked}>Save</button>}
      {selectedRoom && <button className={classNames(DS.button)} onClick={onUndoClicked}>Undo</button>}
      {selectedRoom && <button className={classNames(DS.button, DS.danger)} onClick={onDeleteClicked}>Delete</button>}
    </div>
    <RoomDescription name={name === undefined ? '' : `Room ${roomNo}: ${name}`} text={text || ''} />
  </div>;
}