import React from 'react';

import EncounterCard from './EncounterCard';
import GameState from './GameState';

interface Props {
  game: GameState;
}

export default function PlayerDisplay(props: Props) {
  const curr = props.game.encounter[props.game.currentIndex];
  const rows = props.game.encounter.map((e, index) => <tr key={index} className={index === props.game.currentIndex ? 'highlight' : ''}>
    <td align="left">{index + 1}</td>
    <td align="center">{e.name}</td>
    <td align="right">{e.status?.initiative}</td>
  </tr>);
  return (<div>
    <table aria-label="encounter">
      <thead>
        <tr>
          <td align="left"></td>
          <td>Name</td>
          <td align="right">Initiative</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    {curr && curr.kind === 'monster' && <EncounterCard {...curr} />}
  </div>);
}