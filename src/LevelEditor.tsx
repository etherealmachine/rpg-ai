import React, { useContext, useState } from 'react';
import { css } from 'astroturf';

import DescriptionEditor from './DescriptionEditor';
import { Context } from './State';

const classes = css`
  .features {
    font-family: Helvetica serif;
    font-size: 18px;
    color: white;
    padding: 8px;
  }
`;

export default function LevelEditor() {
  const appState = useContext(Context);
  const level = appState.maps[appState.selection.mapIndex].levels[appState.selection.levelIndex];
  const [lastSelection, setLastSelection] = useState(appState.selection);
  const [tmpName, setTmpName] = useState<string | undefined>(undefined);
  const [tmpDescription, setTmpDescription] = useState<string | undefined>(undefined);
  const onSave = () => {
    appState.setLevelDescription({
      name: tmpName === undefined ? level.name : tmpName,
      description: tmpDescription === undefined ? level.description : tmpDescription
    });
    setTmpName(undefined);
    setTmpDescription(undefined);
  };
  if (appState.selection.mapIndex !== lastSelection.mapIndex) {
    setLastSelection(appState.selection);
    setTmpName(undefined);
    setTmpDescription(undefined);
  }
  const onUndo = () => {
    setTmpName(level.name);
    setTmpDescription(level.description);
  };
  let name = tmpName || '';
  if (tmpName === undefined) name = level.name;
  let description = tmpDescription || '';
  if (tmpDescription === undefined) description = level.description;
  return <React.Fragment>
    <DescriptionEditor
      name={name}
      description={description}
      onNameChange={setTmpName}
      onDescriptionChange={setTmpDescription}
      onSave={onSave}
      onUndo={onUndo}
    />
    <div className={classes.features}>
      {level.features.filter(feature => feature.properties.name !== undefined).map((feature, i) => <div key={i}>
        {`${i + 1}. ${feature.properties.name}`}
      </div>)}
    </div>
  </React.Fragment>;
}