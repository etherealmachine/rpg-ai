import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

import EncounterCard from './EncounterCard';
import GameState from './GameState';

interface Props {
  game: GameState;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'row',
  },
  highlight: {
    backgroundColor: '#a1e3ff',
  },
  table: {
  },
  cardContainer: {

  },
});

export default function PlayerDisplay(props: Props) {
  const classes = useStyles();
  const curr = props.game.encounter[props.game.currentIndex];
  const rows = props.game.encounter.map((e, index) => <TableRow key={index} className={index === props.game.currentIndex ? classes.highlight : ''}>
    <TableCell align="left">{index + 1}</TableCell>
    <TableCell component="th" scope="row">{e.name}</TableCell>
    <TableCell align="right">{e.status?.initiative}</TableCell>
    <TableCell align="right">{('hp' in e) ? e.hp : ''}</TableCell>
  </TableRow>);
  return (<div className={classes.container}>
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="encounter">
        <TableHead>
          <TableRow>
            <TableCell align="left"></TableCell>
            <TableCell>Name</TableCell>
            <TableCell align="right">Initiative</TableCell>
            <TableCell align="right">Conditions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </TableContainer>
    {curr && curr.kind === 'monster' && <div className={classes.cardContainer}><EncounterCard {...curr} /></div>}
  </div>);
}