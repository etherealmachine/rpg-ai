import React from 'react';
import styled from 'styled-components';

import Shell from '../Shell';
import MonsterCard from './MonsterCard';
import SpellCard from './SpellCard';
import ItemCard from './ItemCard';
import GameState from './GameState';

interface Props {
  game: GameState;
}

const Root = styled.div`
  height: 100%;
  .top-panel {
    height: 60%;
    display: flex;
    flex-direction: row;
    overflow: scroll;
  }
  .top-panel .table {
    width: 60%;
    margin: 15px;
    border-collapse: collapse;
  }
  .top-panel .table tr {
    border-bottom: 1px solid #888;
  }
  .top-panel .table td {
    padding: 1vh;
    font-size: 1.5vh;
  }
  .top-panel .card-container {
    width: 40%;
    margin: 15px;
  }
  .shell-container {
    height: 40%;
  }
  .highlight {
    background-color: #a1e3ff;
  }
`;

export default function DMDisplay(props: Props) {
  const selection = props.game.selected || props.game.encounter[props.game.currentIndex];
  const rows = props.game.encounter.map((e, index) => <tr key={index} className={index === props.game.currentIndex ? 'highlight' : ''}>
    <td align="left">{index + 1}</td>
    <td align="center">{e.name}</td>
    <td align="right">{e.status?.initiative}</td>
    <td align="right">{e.status?.hp || ''}</td>
    <td align="right">{e.ac || ''}</td>
    <td align="right">{e.status?.conditions.join(',') || ''}</td>
  </tr>);
  return (<Root>
    <div className="top-panel">
      <table className="table" aria-label="encounter">
        <thead>
          <tr>
            <td align="left"></td>
            <td>Name</td>
            <td align="right">Initiative</td>
            <td align="right">HP</td>
            <td align="right">AC</td>
            <td align="right">Conditions</td>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <div className="card-container">
        {selection && selection.kind === 'monster' && <MonsterCard {...selection} />}
        {selection && selection.kind === 'spell' && <SpellCard {...selection} />}
        {selection && selection.kind === 'item' && <ItemCard {...selection} />}
      </div>
    </div>
    <div className="shell-container">
      <Shell program={props.game} />
    </div>
  </Root>);
}