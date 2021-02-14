import React from 'react';
import { schoolString, Spell } from './Definitions';

function SpellCard(props: { spell: Spell }) {
  const { spell } = props;
  console.log(spell);
  return <div className="card parchment">
    <div className="card-body">
      <div className="d-flex flex-column">
        <div className="d-flex flex-column">
          <h1 className="fw-bold fs-2 redish spectral">{spell.name}</h1>
          <div className="fst-italic">Level {spell.level} {schoolString[spell.school]}</div>
        </div>
        <hr className="divider" />
        <div className="d-flex flex-column">
          {spell.casting_time && <div><span className="fw-bold redish">Casting Time</span> {spell.casting_time}{spell.ritual && ' (R)'}</div>}
          {spell.range && <div><span className="fw-bold redish">Range</span> {spell.range}</div>}
          {spell.duration && <div><span className="fw-bold redish">Duration</span> {spell.duration} ft.</div>}
          {spell.components && <div><span className="fw-bold redish">Components</span> {spell.components}</div>}
          {spell.classes && <div><span className="fw-bold redish">Classes</span> {spell.classes.join(', ')}</div>}
        </div>
        <hr className="divider" />
        <div className="d-flex flex-column">
          {spell.description.map((text, i) => <div key={i}>{text}</div>)}
        </div>
      </div>
    </div>
  </div>;
}

export default SpellCard;