import React from 'react';

const groupBy = function (xs, keyFn) {
  return xs.reduce(function (rv, x) {
    (rv[keyFn(x)] = rv[keyFn(x)] || []).push(x);
    return rv;
  }, {});
};

function Item(props: any) {
  const { item, attackBonus } = props;
  return <div className="d-flex align-items-center">
    <span>{item.name}</span>
    <div className="d-flex flex-column ms-auto">
      <button className="btn btn-light">One-Handed: {item.damage}+{attackBonus}</button>
      {item.damage_2 && <button className="btn btn-light">Two-Handed: {item.damage_2}+{attackBonus}</button>}
    </div>
  </div>;
}

function CharacterCard(props: any) {
  const { character } = props;
  console.log(character);
  const classes = groupBy(character.levels, level => level.character_class.name);
  const desc = Object.entries(classes).map(([name, levels]) => {
    return `Level ${Math.max(...(levels as any).map(level => level.level))} ${character.race.name} ${name}`;
  }).join(', ');
  const attackBonus = "10"
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
      {character.items.map(item => <Item key={item.item.name} item={item.item} attackBonus={attackBonus} />)}
    </div>
  </div>;
}

export default CharacterCard;