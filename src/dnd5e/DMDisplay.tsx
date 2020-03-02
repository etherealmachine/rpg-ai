import React from 'react';

import MonsterCard from './MonsterCard';
import SpellCard from './SpellCard';
import ItemCard from './ItemCard';
import GameState from './GameState';

interface Props {
  game: GameState;
}

export default function DMDisplay(props: Props) {
  const selection = props.game.selected || props.game.encounter[props.game.currentIndex];
  const rows = props.game.encounter.map((e, index) => <tr key={index} className={index === props.game.currentIndex ? 'highlight' : ''}>
    <td align="left">{index + 1}</td>
    <td align="center">{e.name}</td>
    <td align="right">{e.status?.initiative}</td>
    <td align="right">{e.status && ('hp' in e.status) && e.status?.hp}</td>
    <td align="right">{('ac' in e) ? e.ac : ''}</td>
  </tr>);
  return (<div>
    <table aria-label="encounter">
      <thead>
        <tr>
          <td align="left"></td>
          <td>Name</td>
          <td align="right">Initiative</td>
          <td align="right">HP</td>
          <td align="right">AC</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    {selection && selection.kind === 'monster' && <MonsterCard {...selection} />}
    {selection && selection.kind === 'spell' && <SpellCard {...selection} />}
    {selection && selection.kind === 'item' && <ItemCard {...selection} />}
  </div>);
}