import React from 'react';

import { Character, orc1 } from './rules/Character';

export default function CharacterCard(props: any) {
  const {
    name,
    race,
    backstory,
    limbs,
    organs,
    equipped,
    items,
    abilities,
    skills,
    stamina,
    focus,
    faiths,
    connections,
  } = orc1 as Character;
  return <div className="card">
    <div className="card-body">
      <h5 className="card-title">{name}</h5>
      <dl>
        <dt>Race</dt>
        <dd>{race}</dd>
      </dl>
      <p>{backstory}</p>
      <div className="d-flex">
        <dt>Stamina</dt><dd>{stamina.current}</dd>
        <dt>Focus</dt><dd>{focus.current}</dd>
        {faiths.map(faith => <span><dt>Faith ({faith.god})</dt><dd>{faith.current}</dd></span>)}
      </div>
      <div className="d-flex">
        <div>
          <h6>Limbs</h6>
          {limbs.map(limb => <div>{limb.name}</div>)}
        </div>
        <div>
          <h6>Organs</h6>
          {organs.map(organ => <div>{organ.name}</div>)}
        </div>
      </div>
      <div className="d-flex">
        <div className="d-flex flex-column">
          <h6>Abilities</h6>
          {Object.entries(abilities).map(([name, level]) => <span>{name}: {level}</span>)}
        </div>
        <div className="d-flex flex-column">
          <h6>Skills</h6>
          {Object.entries(skills).map(([name, skillset]) => <div>
            <h6>{name}</h6>
            <div>Training: {skillset['Training']}</div>
            <div>Experience: {skillset['Experience']}</div>
          </div>)}
        </div>
      </div>
      <div>
        <h6>Equipped</h6>
        {equipped.map(item => <div>{item.name}</div>)}
      </div>
      <div>
        <h6>Items</h6>
        {items.map(item => <div>{item.name}</div>)}
      </div>
      <h6>Connections</h6>
      {connections.map(connection => <div>{connection.character} ({connection.relationship})</div>)}
    </div>
  </div>;
}