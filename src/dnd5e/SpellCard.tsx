import * as React from 'react';

import { Spell } from './Compendium';

class SpellCard extends React.Component<Spell> {

  private renderText(text: string[] | string) {
    if (!(text instanceof Array)) {
      text = [text];
    }
    return text.map((line, i) => <span key={i}>{line}</span>);
  }

  public render() {
    const {
      name,
      level,
      classes,
      time,
      duration,
      range,
      components,
      school,
      text
    } = this.props;
    return <div>
      <div>
        <h1>{name}</h1>
      </div>
      <div>Level: {level}</div>
      <div>Classes: {classes}</div>
      <div>Time: {time}</div>
      <div>Duration: {duration}</div>
      <div>Range: {range}</div>
      <div>Components: {components}</div>
      <div>School: {school}</div>
      <div>{this.renderText(text)}</div>
    </div>
  }
}

export default SpellCard;