import * as React from 'react';
import { createStyles, WithStyles, withStyles } from '@material-ui/core/styles';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

import { Monster, Status, NameTextPair } from './Compendium';

const styles = createStyles({
  card: {
    margin: '10px 20px',
    overflowY: 'auto',
  },
  media: {
    height: 140,
    backgroundPosition: 'center',
  },
  action: {
    display: 'flex',
    flexDirection: 'column',
  },
  actionName: {
    fontWeight: 600,
  },
  h5InputParent: {
    width: '100%',
    marginBottom: '10px',
  },
  h5Input: {
    width: '100%',
    color: 'rgba(0, 0, 0, 0.87)',
    fontSize: '1.5rem',
    fontWeight: 400,
    lineHeight: '1.33',
    letterSpacing: '0em',
    paddingTop: '3px',
    marginBottom: '2.4px',
    padding: '0',
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
});

interface Props extends Monster, WithStyles<typeof styles> { }

class MonsterCard extends React.Component<Props> {

  private renderStatus(status: Status) {
    if (status.hp) {
      if (status.hp < Math.floor(status.maxHP) / 2) {
        return <Typography>Bloodied</Typography>
      } else if (status.hp <= 0) {
        return <Typography>Dead</Typography>
      }
    }
  }

  private renderAction(action: NameTextPair, index: number) {
    return <div key={index}>{action.name}</div>;
  }

  public render() {
    const {
      classes,
      name,
      imageURL,
      size,
      description,
      status,
    } = this.props;
    return <Card className={classes.card}>
      {imageURL && <CardMedia
        className={classes.media}
        image={imageURL}
        title={name}
      />}
      <CardContent>
        <div className={classes.titleRow}>
          <Typography variant="h5">{name}</Typography>
        </div>
        <Typography>{size}</Typography>
        {status && this.renderStatus(status)}
        {description && <Typography>{description}</Typography>}
        {status && <div>{status.actions.slice(0, 5).map(this.renderAction)}</div>}}
      </CardContent>
    </Card>
  }
}

export default withStyles(styles)(MonsterCard);