import React from 'react';

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

function NPCCard(props: any) {
  const { npc } = props;
  console.log(npc);
  return <div className="card parchment" style={{ minWidth: "300px", color: "#4d150c", fontFamily: "Georgia, serif" }}>
    <div className="card-body">
      <div className="d-flex align-items-start">
        <div className="d-flex align-items-baseline">
          <h5>{npc.name}</h5>
          <span className="ms-1">the {npc.monster.name}</span>
        </div>
        <span className="ms-auto">{npc.initiative}</span>
      </div>
      <div className="d-flex justify-content-between">
        <span>AC {npc.monster.armor_class}</span>
        <span>{npc.hit_points} HP</span>
      </div>
      {npc.monster.actions.map(action => <Action key={action.name} action={action} />)}
    </div>
  </div>;
}

export default NPCCard;