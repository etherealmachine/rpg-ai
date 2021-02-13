import React from 'react';
import { bonusify, capitalize, Monster, sizeString } from './Definitions';

const Regexes = {
  attackType: new RegExp(/(.* Weapon Attack)/),
  toHitBonus: new RegExp(/\+?([-\d]+) to hit/),
  reach: new RegExp(/reach ([\d]+) ft\./),
  range: new RegExp(/range ([\d]+)\/([\d]+) ft\., one target/),
  dmgRoll: new RegExp(/Hit:\s*\d+\s*\(([\d]+)d([\d]+)\s*([+-])\s*([\d]+)\)/),
  dmgType: new RegExp(/(slashing|piercing|bludgeoning) damage/),
};

/*
  Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.
  Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.
  Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage.
*/
function parseAttack(text: string) {
  const matches = Object.fromEntries(Object.entries(Regexes).map(([name, regex]) => [name, regex.exec(text)]));
  return {
    melee: matches.attackType && matches.attackType[1].includes('Melee'),
    ranged: matches.attackType && matches.attackType[1].includes('Ranged'),
    toHitBonus: matches.toHitBonus && parseInt(matches.toHitBonus[1]),
    reach: matches.reach && parseInt(matches.reach[1]),
    range: matches.range && [parseInt(matches.range[1]), parseInt(matches.range[2])],
    dmgRoll: matches.dmgRoll && matches.dmgRoll.slice(1),
    dmgType: matches.dmgType && matches.dmgType[1],
  };
}

function Action(props: any) {
  const { action } = props;
  const attack = parseAttack(action.text);
  return <div className="d-flex align-items-center">
    <div className="d-flex flex-column">
      <div className="d-flex">
        <span className="me-2">{action.name}</span>
        {attack.reach && <span>Reach {attack.reach} ft.</span>}
        {attack.range && <span>Range {attack.range[0]}/{attack.range[1]} ft.</span>}
      </div>
      {attack && <div>
        <button className="btn btn-light">1d20+{attack.toHitBonus}</button>
        {<button className="btn btn-light">{attack.dmgRoll[0]}d{attack.dmgRoll[1]}{attack.dmgRoll[2]}{attack.dmgRoll[3]}</button>}
      </div>}
    </div>
  </div>;
}

function MonsterCard(props: { monster: Monster }) {
  const { monster } = props;
  return <div className="card parchment">
    <div className="card-body">
      <div className="d-flex flex-column">
        <div className="d-flex flex-column">
          <h1 className="fw-bold fs-2 redish spectral">{monster.name}</h1>
          <div className="fst-italic">{sizeString[monster.size]} {monster.types[0]}, {monster.alignment}</div>
        </div>
        <hr className="divider" />
        <div className="d-flex align-items-center">
          <div className="d-flex flex-column flex-grow-1">
            <div className="d-flex flex-column">
              <div><span className="fw-bold redish">Armor Class</span> {monster.armor_description}</div>
              <div><span className="fw-bold redish">Hit Points</span> {monster.hit_points}</div>
              <div><span className="fw-bold redish">Speed</span> {monster.speed} ft.</div>
            </div>
            <hr className="divider" />
            <div className="d-flex flex-column">
              <div><span className="fw-bold redish">Skills</span> {Object.entries(monster.skills).map(([name, bonus]) => `${capitalize(name)} ${bonusify(bonus)}`).join(', ')}</div>
              <div><span className="fw-bold redish">Senses</span> {monster.senses.map(capitalize).join(', ')}</div>
              <div><span className="fw-bold redish">Languages</span> {monster.languages.map(capitalize).join(', ')}</div>
              <div><span className="fw-bold redish">Challenge</span> {monster.challenge_rating}</div>
            </div>
          </div>
          <div className="redish-border p-2" style={{ borderSpacing: '12px', border: '4px solid' }}>
            <table cellPadding="4px">
              <tr><td className="fw-bold redish">Str</td><td>{monster.abilities.str}</td></tr>
              <tr><td className="fw-bold redish">Dex</td><td>{monster.abilities.dex}</td></tr>
              <tr><td className="fw-bold redish">Con</td><td>{monster.abilities.con}</td></tr>
              <tr><td className="fw-bold redish">Int</td><td>{monster.abilities.int}</td></tr>
              <tr><td className="fw-bold redish">Wis</td><td>{monster.abilities.wis}</td></tr>
              <tr><td className="fw-bold redish">Cha</td><td>{monster.abilities.cha}</td></tr>
            </table>
          </div>
        </div>
      </div>
      <hr className="divider" />
      <div className="d-flex flex-column">
        <h2 className="fw-bold fs-3 redish spectral">Traits</h2>
        {monster.traits.map(feature => <div>
          <div className="fw-bold fst-italic">{feature.name}</div>
          <div>{feature.text}</div>
        </div>)}
      </div>
      <hr className="divider" />
      <div className="d-flex flex-column">
        <h2 className="fw-bold fs-3 redish spectral">Actions</h2>
        {monster.actions.map(feature => <div>
          <div className="fw-bold fst-italic">{feature.name}</div>
          <div>{feature.text}</div>
        </div>)}
      </div>
    </div>
  </div>;
}

export default MonsterCard;