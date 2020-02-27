import React from 'react';

import GameState, { GameMode } from './GameState';
import DMDisplay from './DMDisplay';
import PlayerDisplay from './PlayerDisplay';

interface Props {
  game: GameState;
}

export default function Display(props: Props) {
  return (props.game.mode === GameMode.DM ? <DMDisplay game={props.game} /> : <PlayerDisplay game={props.game} />);
}