import React, { useContext } from 'react';
import { css } from 'astroturf';
import marked from 'marked';
import { sanitize } from 'dompurify';

import Canvas from './Canvas';
import { Context } from './State';

const classes = css`
  .print {
    display: flex;
    flex-direction: column;
    font-family: Helvetica serif;
  }
  .page {
    width: 8in;
    height: 10.5in;
    display: flex;
    flex-direction: column;
    margin-left: auto;
    margin-right: auto;
    border-bottom: 1px solid black;
    padding: 0.25in;
  }
  @media print {
    .page {
      border-bottom: none !important;
    }
  }
  .pages {
    width: 8in;
    display: flex;
    flex-direction: column;
    margin-left: auto;
    margin-right: auto;
    padding: 0.25in;
  }
  .canvasWrapper {
    flex-grow: 1;
  }
`;

export default function PrintLayout() {
  const appState = useContext(Context);
  const map = appState.maps[appState.selection.mapIndex];
  let features = [];
  map.levels.forEach((level, i) => {
    level.features.forEach(feature => {
      if (feature.properties.name) {
        features.push({
          title: `${i + 1}.${features.length + 1} ${feature.properties.name}`,
          text: sanitize(marked(feature.properties.description || '')),
        });
      }
    });
  });
  return <div className={classes.print}>
    <div className={classes.page}>
      <h2>{map.name}</h2>
      <div dangerouslySetInnerHTML={{ __html: sanitize(marked(map.description)) }} />
      <div className={classes.canvasWrapper}>
        <Canvas mode="print" />
      </div>
    </div>
    <div className={classes.pages}>
      {features.map(feature => <div key={feature.title}>
        <h3>{feature.title}</h3>
        <div dangerouslySetInnerHTML={{ __html: feature.text }} />
      </div>)}
    </div>
  </div>;
}