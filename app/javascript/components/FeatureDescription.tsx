import React from 'react';
import { Feature } from './Definitions';

function FeatureDescription(props: Feature) {
  const descs = Array.isArray(props.text) ? props.text : [props.text];
  return <div className="d-flex flex-column">
    <div className="fw-bold fst-italic">{props.name}</div>
    {descs.map((desc, i) => <div key={i}>{desc}</div>)}
  </div>;
}

export default FeatureDescription;