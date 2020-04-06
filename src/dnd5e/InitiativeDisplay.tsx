import React from 'react';
import styled from 'styled-components';

import GameState from './GameState';

interface Props {
  game: GameState;
}

const Card = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px;
`;

const CardContent = styled.div`
  img {
    max-height: 400px;
    max-width: 400px;
  }
`;

const Table = styled.table`
  width: 80%;
  margin-top: 10px;
  margin-left: auto;
  margin-right: auto;
  border-collapse: collapse;
  tr {
    border-bottom: 1px solid #888;
  }
  td {
    padding: 1vh;
    font-size: 1.5vh;
  }
  th {
    padding: 10px;
  }
  .highlight {
    background-color: #a1e3ff;
  }
`;

export default function InitiativeDisplay(props: Props) {
  const curr = props.game.encounter[props.game.currentIndex];
  const rows = props.game.encounter.map((e, index) => <tr key={index} className={index === props.game.currentIndex ? 'highlight' : ''}>
    <td align="left">{index + 1}</td>
    <td align="center">{e.name}</td>
    <td align="right">{e.size}</td>
    <td align="right">{e.status?.conditions}</td>
    <td align="right">{e.status?.initiative}</td>
  </tr>);
  return (
    <div>
      {curr && <Card>
        <CardContent>
          <img alt={curr.name} src={`${process.env.PUBLIC_URL}/images/dnd5e/tokens/${encodeURIComponent(curr.name)}`} />
          <h3>{curr.name}</h3>
          <div>Size: {curr.size}</div>
        </CardContent>
      </Card>}
      <Table aria-label="encounter">
        <thead>
          <tr>
            <th align="left"></th>
            <th align="center">Name</th>
            <th align="right">Size</th>
            <th align="right">Conditions</th>
            <th align="right">Initiative</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </div>
  );
}