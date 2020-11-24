import React, { useContext, useState } from 'react';
import { css } from 'astroturf';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons';

import DescriptionEditor from './DescriptionEditor';
import { Context } from './State';

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
  const appState = useContext(Context);
  const selection = appState.getSelectedFeature();
  const [lastSelection, setLastSelection] = useState(appState.selection);
  const [tmpName, setTmpName] = useState<string | undefined>(undefined);
  const [tmpDescription, setTmpDescription] = useState<string | undefined>(undefined);
  if (appState.selection.levelIndex !== lastSelection.levelIndex || appState.selection.featureIndex !== lastSelection.featureIndex) {
    setLastSelection(appState.selection);
    setTmpName(undefined);
    setTmpDescription(undefined);
  }
  const onSave = () => {
    appState.setDescription({ name: tmpName, description: tmpDescription });
    setTmpName('');
    setTmpDescription('');
  };
  const onUndo = () => {
    if (!selection) return;
    if (selection.feature.properties.name) setTmpName(selection.feature.properties.name);
    if (selection.feature.properties.description) setTmpDescription(selection.feature.properties.description);
  };
  const onDelete = () => {
    appState.handleDelete();
  }
  let name = tmpName || '';
  if (tmpName === undefined && selection?.feature.properties.name !== undefined) {
    name = selection?.feature.properties.name;
  }
  let description = tmpDescription || '';
  if (tmpDescription === undefined && selection?.feature.properties.description !== undefined) {
    description = selection?.feature.properties.description;
  }
  return <div className={classNames(classes.drawer, appState.drawerOpen && classes.open)}>
    <button
      className={classNames(classes.toggleButton, appState.drawerOpen && classes.open)}
      onClick={() => appState.toggleDrawer(!appState.drawerOpen)}>
      {appState.drawerOpen && <FontAwesomeIcon icon={faCaretRight} />}
      {!appState.drawerOpen && <FontAwesomeIcon icon={faCaretLeft} />}
    </button>
    {selection && <DescriptionEditor
      name={name}
      description={description}
      onNameChange={setTmpName}
      onDescriptionChange={setTmpDescription}
      onSave={onSave}
      onUndo={onUndo}
      onDelete={onDelete}
    />}
  </div>;
}