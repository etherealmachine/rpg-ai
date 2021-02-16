import React, { useRef } from 'react';
import { useState } from 'react';
import classNames from 'classnames';
import { css } from 'astroturf';

import { Character } from './Definitions';
import MonsterCard from './MonsterCard';
import { call } from './API';

const styles = css`
  .watches > div {
    height: 150px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .watches > div:hover {
    background-color: #00000011;
  }
  .watches svg {
    max-width: 50px;
    flex-grow: 1;
  }
  .watch1 svg circle {
    fill: #646464;
  }
  .watch2 svg circle {
    fill: #FFE545;
  }
  .watch2 svg {
    position: relative;
    top: 20px;
  }
  .watch3 svg circle {
    fill: #FFE545;
  }
  .watch3 svg {
    position: relative;
    top: -25px;
  }
  .watch4 svg circle {
    fill: #FFE545;
  }
  .watch4 svg {
    position: relative;
    top: -25px;
  }
  .watch5 svg circle {
    fill: #FFE545;
  }
  .watch5 svg {
    position: relative;
    top: 20px;
  }
  .watch6 svg circle {
    fill: #646464;
  }
`;

function Encounter(props: { id: number, searchTerms: string[], characters: Character[] }) {
  const { id, searchTerms, characters } = props;
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>();
  const addFromSearch = (_event: React.MouseEvent) => {
    if (searchRef.current) call('encounters', id, { action: "add", name: searchRef.current.value }, "PATCH");
  };
  const removeCharacter = (c: Character) => (_event: React.MouseEvent) => {
    call('encounters', id, { action: "remove", id: c.id }, "PATCH");
  }
  return <div>
    <div className="d-flex mb-4">
      <input ref={searchRef} type="text" className="form-control" list="options" placeholder="Search" />
      <button className="btn btn-primary" onClick={addFromSearch}>Add</button>
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
            <th></th>
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
          <td><button className="btn btn-light" onClick={removeCharacter(c)}><i className="fa fa-times" /></button></td>
        </tr>)}</tbody>
      </table>
      {selectedCharacter !== null && characters[selectedCharacter].monster && <MonsterCard monster={characters[selectedCharacter].monster} />}
    </div>
    <div className="d-flex flex-column">
      <div className={classNames(["d-flex", "justify-content-between", styles.watches])}>
        <div className={styles.watch1}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <div className="d-flex flex-column align-items-center">
            <span>Midnight</span>
            <span>12AM - 4AM</span>
          </div>
        </div>
        <div className={styles.watch2}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <div className="d-flex flex-column align-items-center">
            <span>Morning</span>
            <span>4AM - 8AM</span>
          </div>
        </div>
        <div className={styles.watch3}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <div className="d-flex flex-column align-items-center">
            <span>Forenoon</span>
            <span>8AM - 12PM</span>
          </div>
        </div>
        <div className={styles.watch4}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <div className="d-flex flex-column align-items-center">
            <span>Afternoon</span>
            <span>12PM - 4PM</span>
          </div>
        </div>
        <div className={styles.watch5}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <div className="d-flex flex-column align-items-center">
            <span>Dog</span>
            <span>4PM - 8PM</span>
          </div>
        </div>
        <div className={styles.watch6}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <div className="d-flex flex-column align-items-center">
            <span>First</span>
            <span>8PM - 12AM</span>
          </div>
        </div>
      </div>
      <div className="flex-grow-1 d-flex justify-content-center">
        <img src="/images/HSI/Map.png" alt="Map of Hot Springs Island" />
      </div>
    </div>
  </div >;
}

export default Encounter;