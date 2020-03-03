import React from 'react';

import { Item } from './Compendium';

class ItemCard extends React.Component<Item> {

  private renderText(text: string[] | string) {
    if (!(text instanceof Array)) {
      text = [text];
    }
    return text.map((line, i) => <span key={i}>{line}</span>);
  }

  public render() {
    const {
      name,
      range,
      dmg1,
      dmgType,
      value,
      ac,
      text,
    } = this.props;
    return <div>
      <div>
        <h1>{name}</h1>
      </div>
      <div>Range: {range}</div>
      <div>Damage: {dmg1}</div>
      <div>Type: {dmgType}</div>
      <div>Value: {value}</div>
      <div>AC: {ac}</div>
      <div>{this.renderText(text)}</div>
    </div>
  }
}

export default ItemCard;