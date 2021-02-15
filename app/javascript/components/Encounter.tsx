import React from 'react';
import { useState } from 'react';
import classNames from 'classnames';

import { Character } from './Definitions';
import MonsterCard from './MonsterCard';

function Encounter(props: { searchTerms: string[], characters: Character[] }) {
  const { searchTerms, characters } = props;
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  return <div>
    <div className="d-flex mb-4">
      <input type="text" className="form-control" list="options" placeholder="Search" />
      <button className="btn btn-primary">Add</button>
      <datalist id="options">{searchTerms.map(term => <option key={term} value={term} />)}</datalist>
    </div>
    <div className="d-flex">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Initiative</th>
            <th>Name</th>
            <th>HP</th>
            <th>AC</th>
            <th>Conditions</th>
          </tr>
        </thead>
        <tbody>{characters.map((c, i) => <tr
          key={i}
          className={classNames({ 'table-active': selectedCharacter === i })}
          onClick={_event => setSelectedCharacter(i)}>
          <td>{c.initiative}</td>
          <td>{c.name}</td>
          <td>{c.hit_points}</td>
          <td>{c.monster?.armor_class}</td>
          <td>{c.conditions?.join(', ')}</td>
        </tr>)}</tbody>
      </table>
      {selectedCharacter !== null && characters[selectedCharacter].monster && <MonsterCard monster={characters[selectedCharacter].monster} />}
    </div>
  </div >;
}

export default Encounter;