import * as React from 'react';

import { Compendium, Monster, NameTextPair } from './Compendium';

class MonsterCard extends React.Component<Monster> {

  private renderAction = (action: NameTextPair, i: number) => {
    return <div key={`action-${i}`}>
      <span>{action.name}</span>:<span>{action.text}</span>
    </div>;
  }

  private renderActions = (actions: NameTextPair[] | NameTextPair | undefined) => {
    if (!actions) {
      return null;
    }
    if (!(actions instanceof Array)) {
      actions = [actions];
    }
    const content = actions.map(this.renderAction)
    return <div>{content}</div>;
  }

  public render() {
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
    } = this.props;
    const actions = this.renderActions(action);
    const reactions = this.renderActions(reaction);
    const legendaryActions = this.renderActions(legendary);
    const traits = this.renderActions(trait);
    return <div>
      <h1>{name}</h1>
      <div className="row justify-content-space-around">
        <table>
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
        <table>
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
      <div>Speed: {speed}</div>
      <div>Skills: {skill}</div>
      <div>Senses: {senses}</div>
      <div>Languages: {languages}</div>
      <div>Alignment: {alignment}</div>
      <div>Type: {type}</div>
      {description && <div>{description}</div>}
      {actions && <div>
        <h2>Actions</h2>
        {actions}
      </div>}
      {reactions && <div>
        <h2>Reactions</h2>
        {reactions}
      </div>}
      {legendaryActions && <div>
        <h2>Legendary Actions</h2>
        {legendaryActions}
      </div>}
      {traits && <div>
        <h2>Traits</h2>
        {traits}
      </div>}
      {save && <div>Save: {save}</div>}
      {resist && <div>Resist: {resist}</div>}
      {vulnerable && <div>Vulnerable: {vulnerable}</div>}
      {immune && <div>Immune: {immune}</div>}
      {conditionImmune && <div>Condition Immunities: {conditionImmune}</div>}
      {spells && <div>Spells: {spells}</div>}
      {slots && <div>{slots}</div>}
    </div>
  }
}

export default MonsterCard;