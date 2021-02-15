import React from 'react';
import { bonusify, capitalize, Monster, sizeString } from './Definitions';
import FeatureDescription from './FeatureDescription';

function MonsterCard(props: { monster: Monster }) {
  const { monster } = props;
  return <div className="card parchment">
    <div className="card-body">
      <div className="d-flex flex-column">
        <div className="d-flex flex-column">
          <h1 className="fw-bold fs-2 redish spectral">{monster.name}</h1>
          <div className="fst-italic">{sizeString[monster.size]} {monster.types[0]}{monster.alignment && `, ${monster.alignment}`}</div>
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
              {monster.skills && <div><span className="fw-bold redish">Skills</span> {Object.entries(monster.skills).map(([name, bonus]) => `${capitalize(name)} ${bonusify(bonus)}`).join(', ')}</div>}
              {monster.senses && <div><span className="fw-bold redish">Senses</span> {monster.senses.map(capitalize).join(', ')}</div>}
              {monster.languages && <div><span className="fw-bold redish">Languages</span> {monster.languages.map(capitalize).join(', ')}</div>}
              {monster.challenge_rating && <div><span className="fw-bold redish">Challenge</span> {monster.challenge_rating}</div>}
            </div>
          </div>
          <div className="redish-border p-2" style={{ borderSpacing: '12px', border: '4px solid' }}>
            <table cellPadding="4px">
              <tbody>
                <tr><td className="fw-bold redish">Str</td><td>{monster.abilities.str}</td></tr>
                <tr><td className="fw-bold redish">Dex</td><td>{monster.abilities.dex}</td></tr>
                <tr><td className="fw-bold redish">Con</td><td>{monster.abilities.con}</td></tr>
                <tr><td className="fw-bold redish">Int</td><td>{monster.abilities.int}</td></tr>
                <tr><td className="fw-bold redish">Wis</td><td>{monster.abilities.wis}</td></tr>
                <tr><td className="fw-bold redish">Cha</td><td>{monster.abilities.cha}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {monster.traits && <div>
        <hr className="divider" />
        <div className="d-flex flex-column">
          <h2 className="fw-bold fs-3 redish spectral">Traits</h2>
          {monster.traits.map(feature => <FeatureDescription key={feature.name} {...feature} />)}
        </div>
      </div>}
      {monster.actions && <div>
        <hr className="divider" />
        <div className="d-flex flex-column">
          <h2 className="fw-bold fs-3 redish spectral">Actions</h2>
          {monster.actions.map(feature => <FeatureDescription key={feature.name} {...feature} />)}
        </div>
      </div>}
      {monster.reactions && <div>
        <hr className="divider" />
        <div className="d-flex flex-column">
          <h2 className="fw-bold fs-3 redish spectral">Reactions</h2>
          {monster.reactions.map(feature => <FeatureDescription key={feature.name} {...feature} />)}
        </div>
      </div>}
      {monster.legendaries && <div>
        <hr className="divider" />
        <div className="d-flex flex-column">
          <h2 className="fw-bold fs-3 redish spectral">Legendary Actions</h2>
          {monster.legendaries.map(feature => <FeatureDescription key={feature.name} {...feature} />)}
        </div>
      </div>}
    </div>
  </div>;
}

export default MonsterCard;