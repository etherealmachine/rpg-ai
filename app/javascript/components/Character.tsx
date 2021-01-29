import React from 'react';

function Character() {
  return <div className="card">
    <div className="card-body">
      <h5 className="card-title">Adventurer</h5>
      <p className="card-text">Master of sword and shield.</p>
      <ul>
        <li>Strength: +1</li>
        <li>Constitution: +2</li>
        <li>Intelligence: +0</li>
        <li>Dexterity: +1</li>
        <li>Wisdom: -1</li>
        <li>Charisma: -1</li>
      </ul>
    </div>
  </div>;
}

export default Character;