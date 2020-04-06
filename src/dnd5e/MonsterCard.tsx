import React from 'react';
import styled from 'styled-components';

import { Compendium, Monster, Spellcasting, SpellSlots, NameTextPair } from './Compendium';

const Card = styled.div`
h1 {
  font-size: 2vh;
}
h2 {
  font-size: 1.8vh;
}
h3 {
  font-size: 1.5vh;
}
th, td, div {
  font-size: 1.5vh;
}
.stat-blocks {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.indent {
  padding-left: 16px;
}
`;

class MonsterCard extends React.Component<Monster> {

  private renderAction(action: NameTextPair, i: number) {
    if (action.text instanceof Array) {
      return <div key={i}>
        <div>{`${i + 1}. ${action.name}`}</div>
        {action.text.map((text, j) => <div key={j} className="indent">{text}</div>)}
      </div>;
    }
    return <div key={i}>{`${i + 1}. ${action.name}: ${action.text}`}</div>;
  }

  private renderActions(actions: NameTextPair[] | NameTextPair | undefined) {
    if (!actions) {
      return null;
    }
    if (!(actions instanceof Array)) {
      actions = [actions];
    }
    const content = actions.filter(action => action.name !== 'Spellcasting').map(this.renderAction)
    return <div>{content}</div>;
  }

  private renderSpellcasting(casting: Spellcasting) {
    return <div><span>{`Spell Save DC: ${casting.dc}, Spell Attack +${casting.modifier}`}</span></div>
  }

  private renderSpellSlot(level: SpellSlots, i: number) {
    if (level.spells.length === 0) {
      return null;
    }
    return <div key={i}>
      <h3>
        {i === 0 ? 'Cantrips' : `Level ${i}`}
        {i === 0 ? null : <span><span> - &nbsp;</span>{level.slots} Slots</span>}
      </h3>
      <div>{level.spells.map((spell) => spell.name).join(', ')}</div>
    </div>;
  }

  private renderSpellSlots(spellSlots: SpellSlots[]) {
    return spellSlots.map(this.renderSpellSlot)
  }

  public render() {
    const {
      name,
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
      status,
    } = this.props;
    const actions = this.renderActions(action);
    const reactions = this.renderActions(reaction);
    const legendaryActions = this.renderActions(legendary);
    const traits = this.renderActions(trait);
    return <Card>
      <h1>{name}</h1>
      <div className="stat-blocks">
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
      {save && <div>Save: {save}</div>}
      {resist && <div>Resist: {resist}</div>}
      {vulnerable && <div>Vulnerable: {vulnerable}</div>}
      {immune && <div>Immune: {immune}</div>}
      {conditionImmune && <div>Condition Immunities: {conditionImmune}</div>}
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
      {status && status.spellcasting && this.renderSpellcasting(status.spellcasting)}
      {status && status.spellSlots && this.renderSpellSlots(status.spellSlots)}
    </Card>
  }
}

export default MonsterCard;