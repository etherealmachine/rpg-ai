import React from 'react';

function CharacterCard(props: any) {
  const { character } = props;
  return <div className="card parchment" style={{ minWidth: "300px", color: "#4d150c", fontFamily: "Georgia, serif" }}>
    <div className="card-body">
      <div className="d-flex align-items-start">
        <h5>{character.name}</h5>
        <span className="ms-auto">{character.initiative}</span>
      </div>
      <div className="d-flex justify-content-between">
        <span>{(character.conditions || []).join(',')}</span>
        <span>{character.hit_points} HP</span>
      </div>
    </div>
  </div>;
}

export default CharacterCard;