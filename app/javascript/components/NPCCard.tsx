import React from 'react';

const ActionRegex = new RegExp(/(.* Weapon Attack): \+?([-\d]+) to hit, reach ([\d]+) ft\..*Hit: [\d]+ \((.*)\) (slashing|piercing|bludgeoning) damage/);

/*
  Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.
  Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.
  Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage.
*/
function parseAction(text: string) {
  const matches = ActionRegex.exec(text);
  if (!matches || matches.length !== 6) return null;
  return {
    melee: matches[1].includes('Melee'),
    ranged: matches[1].includes('Ranged'),
    toHitBonus: matches[2],
    reach: matches[3],
    dmgRoll: matches[4],
    dmgType: matches[5],
  };
}

function Action(props: any) {
  const { action } = props;
  const stats = parseAction(action.text);
  return <div className="d-flex align-items-center">
    <div className="d-flex flex-column">
      <span>{action.name}</span>
      <span>{stats && JSON.stringify(stats)}</span>
    </div>
    {stats &&
      <div className="d-flex flex-column ms-auto">
        <button className="btn btn-light">{stats.dmgRoll}</button>
      </div>
    }
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