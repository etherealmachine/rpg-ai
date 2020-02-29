import * as React from 'react';
import { createStyles, WithStyles, withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

import { Compendium, Monster, NameTextPair } from './Compendium';

const styles = createStyles({
  card: {
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
  table: {
    textAlign: 'center',
  },
  numberInputParent: {
    maxWidth: '2em',
    alignSelf: 'center',
  },
  iconButton: {
    padding: 0,
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
});

interface Props extends WithStyles<typeof styles> {
  monster: Monster;
}

class MonsterCard extends React.Component<Props> {

  private renderAction = (action: NameTextPair, i: number) => {
    return <span key={`action-${i}`}>
      <span className={this.props.classes.actionName}>{action.name}</span>: {action.text}
    </span>;
  }

  private renderActions = (actions: NameTextPair[] | NameTextPair | undefined) => {
    if (!actions) {
      return null;
    }
    if (!(actions instanceof Array)) {
      actions = [actions];
    }
    const content = actions.map(this.renderAction)
    return <div className={this.props.classes.action}>
      {content}
    </div>;
  }

  public render() {
    const { classes, monster } = this.props;
    const {
      name,
      imageURL,
      cr, ac, hp, passive,
      size, speed,
      str, dex, con, int, wis, cha,
      skill,
      senses,
      alignment,
      languages,
      type,
      description,
      action, reaction, legendary,
      trait,
      save,
      resist, vulnerable, immune, conditionImmune,
      spells, slots,
    } = monster;
    const actions = this.renderActions(action);
    const reactions = this.renderActions(reaction);
    const legendaryActions = this.renderActions(legendary);
    const traits = this.renderActions(trait);
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
        <div className="row justify-content-space-around">
          <table className={classNames("flex-1", classes.table)}>
            <thead>
              <tr>
                <th>CR</th>
                <th>XP</th>
                <th>AC</th>
                <th>HP</th>
                <th>Passive</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{cr}</td>
                <td>{Compendium.cr_to_xp[cr]}</td>
                <td>{(typeof (ac) === 'string') ? ac.split(' ')[0] : ac}</td>
                <td>{(typeof (hp) === 'string') ? hp.split(' ')[0] : hp}</td>
                <td>{passive}</td>
                <td>{size}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="row">
          <table className={classNames("flex-1", classes.table)}>
            <thead>
              <tr>
                <th>Str</th>
                <th>Dex</th>
                <th>Con</th>
                <th>Int</th>
                <th>Wis</th>
                <th>Cha</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{Compendium.modifierText(Compendium.modifier(str))}</td>
                <td>{Compendium.modifierText(Compendium.modifier(dex))}</td>
                <td>{Compendium.modifierText(Compendium.modifier(con))}</td>
                <td>{Compendium.modifierText(Compendium.modifier(int))}</td>
                <td>{Compendium.modifierText(Compendium.modifier(wis))}</td>
                <td>{Compendium.modifierText(Compendium.modifier(cha))}</td>
              </tr>
              <tr>
                <td>{str}</td>
                <td>{dex}</td>
                <td>{con}</td>
                <td>{int}</td>
                <td>{wis}</td>
                <td>{cha}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Typography>Speed: {speed}</Typography>
        <Typography>Skills: {skill}</Typography>
        <Typography>Senses: {senses}</Typography>
        <Typography>Languages: {languages}</Typography>
        <Typography>Alignment: {alignment}</Typography>
        <Typography>Type: {type}</Typography>
        {description && <Typography>{description}</Typography>}
        {actions && <div>
          <Typography gutterBottom variant="h6">Actions</Typography>
          {actions}
        </div>}
        {reactions && <div>
          <Typography gutterBottom variant="h6">Reactions</Typography>
          {reactions}
        </div>}
        {legendaryActions && <div>
          <Typography gutterBottom variant="h6">Legendary Actions</Typography>
          {legendaryActions}
        </div>}
        {traits && <div>
          <Typography gutterBottom variant="h6">Traits</Typography>
          {traits}
        </div>}
        {save && <Typography>Save: {save}</Typography>}
        {resist && <Typography>Resist: {resist}</Typography>}
        {vulnerable && <Typography>Vulnerable: {vulnerable}</Typography>}
        {immune && <Typography>Immune: {immune}</Typography>}
        {conditionImmune && <Typography>Condition Immunities: {conditionImmune}</Typography>}
        {spells && <Typography>Spells: {spells}</Typography>}
        {slots && <div>{slots}</div>}
      </CardContent>
    </Card>
  }
}

export default withStyles(styles)(MonsterCard);