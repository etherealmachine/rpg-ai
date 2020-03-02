import * as React from 'react';

import { Monster, Status, NameTextPair } from './Compendium';

class MonsterCard extends React.Component<Monster> {

  private renderStatus(status: Status) {
    if (status.hp !== undefined) {
      if (status.hp <= 0) {
        return <span>Dead</span>
      } else if (status.hp < Math.floor(status.maxHP) / 2) {
        return <span>Bloodied</span>
      }
    }
  }

  private renderAction(action: NameTextPair, index: number) {
    return <div key={index}>{action.name}</div>;
  }

  public render() {
    const {
      name,
      imageURL,
      size,
      description,
      status,
    } = this.props;
    return <div>
      <div>
        <h5>{name}</h5>
      </div>
      <div>{size}</div>
      {status && this.renderStatus(status)}
      {description && <div>{description}</div>}
      {status && <div>{status.actions.slice(0, 5).map(this.renderAction)}</div>}
    </div>
  }
}

export default MonsterCard;