import React from 'react';

const groupBy = function (xs, keyFn) {
  return xs.reduce(function (rv, x) {
    (rv[keyFn(x)] = rv[keyFn(x)] || []).push(x);
    return rv;
  }, {});
};

function Abilities(props: any) {
  const { abilities } = props;
  return <div className="d-flex flex-column">
    <div>Str: {abilities.str}</div>
    <div>Dex: {abilities.dex}</div>
    <div>Con: {abilities.con}</div>
    <div>Int: {abilities.int}</div>
    <div>Wis: {abilities.wis}</div>
    <div>Cha: {abilities.cha}</div>
  </div>;
}

function Item(props: any) {
  const { item, attackBonus } = props;
  return <div className="d-flex flex-column">
    <div className="fw-bold">{item.name}</div>
    <div className="d-flex flex-row">
      <div>+{attackBonus} to Hit</div>
      <div>{item.damage} (One-Handed)</div>
      {item.damage_2 && <div>{item.damage_2} (Two-Handed)</div>}
    </div>
  </div>;
}

function Spell(props: any) {
  const { spell, saveDC, attackBonus } = props;
  return <div className="d-flex flex-column">
    <div className="fw-bold">{spell.name}</div>
    <div className="d-flex flex-column">
      {spell.description.map((line, i) => <div key={i}>{line}</div>)}
    </div>
  </div>;
}

function CharacterSheet(props: any) {
  const { character } = props;
  console.log(character);
  const classes = groupBy(character.levels, level => level.character_class.name);
  const desc = Object.entries(classes).map(([name, levels]) => {
    return `Level ${Math.max(...(levels as any).map(level => level.level))} ${character.race.name} ${name}`;
  }).join(', ');
  const attackBonus = "10";
  const spellSaveDC = "17";
  const spellAttackBonus = "9";
  return <div className="card parchment" style={{ minWidth: "300px", color: "#4d150c", fontFamily: "Georgia, serif" }}>
    <div className="card-body">
      <div className="d-flex align-items-start">
        <h5>{character.name}</h5>
        <span className="ms-auto">{character.initiative}</span>
      </div>
      <div className="d-flex justify-content-between">
        <span>{desc}</span>
        <span>{character.hit_points} HP</span>
      </div>
      <div className="d-flex justify-content-between">
        <span>{character.proficiencies.join(', ')}</span>
      </div>
      <Abilities abilities={character.abilities} />
      <h4>Items</h4>
      <div className="d-flex justify-content-between">
        <span>{character.gold} Gold</span>
      </div>
      {character.items.map(item => <Item key={item.item.name} item={item.item} attackBonus={attackBonus} />)}
      <h4>Spells</h4>
      {character.spells.map(spell => <Spell key={spell.spell.name} spell={spell.spell} saveDC={spellSaveDC} attackBonus={spellAttackBonus} />)}
    </div>
  </div>;
}

export default CharacterSheet;