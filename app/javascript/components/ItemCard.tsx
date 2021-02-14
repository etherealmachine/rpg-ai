import React from 'react';
import { damageTypeString, Item, itemPropertiesString } from './Definitions';

function ItemCard(props: { item: Item }) {
  const { item } = props;
  const attrs = [
    item.magical ? `${item.rarity} Magical` : 'Mundane',
    item.armor_class && 'Armor',
    item.damage && 'Weapon',
    !item.armor_class && !item.damage && 'Item',
    item.attunement && '(Requires Attunement)',
  ].filter(x => x).join(' ');
  const hasProps = item.range || item.damage || item.damage_2 || item.armor_class || item.stealth || item.value || item.weight || item.properties;
  return <div className="card parchment">
    <div className="card-body">
      <div className="d-flex flex-column">
        <div className="d-flex flex-column">
          <h1 className="fw-bold fs-2 redish spectral">{item.name}</h1>
          <div className="fst-italic">{attrs}</div>
        </div>
        {hasProps && <div><hr className="divider" />
          <div className="d-flex flex-column">
            {item.range && <div><span className="fw-bold redish">Range</span> {item.range}{item.range_2 && ` / ${item.range_2}`} ft.</div>}
            {item.damage && <div><span className="fw-bold redish">Damage</span> {item.damage} {damageTypeString[item.damage_type]}</div>}
            {item.damage_2 && <div><span className="fw-bold redish">Damage (Secondary)</span> {item.damage_2}</div>}
            {item.armor_class && <div><span className="fw-bold redish">AC</span> {item.armor_class}</div>}
            {item.strength && <div><span className="fw-bold redish">Strength</span> {item.strength}</div>}
            {item.value && <div><span className="fw-bold redish">Value</span> {item.value} gp</div>}
            {item.weight && <div><span className="fw-bold redish">Weight</span> {item.weight} lbs.</div>}
            {item.properties && <div className="fst-italic">{item.properties.map(p => itemPropertiesString[p]).join(', ')}</div>}
          </div>
        </div>}
        <hr className="divider" />
        {item.description && <div className="d-flex flex-column">
          {item.description.map((text, i) => <div key={i}>{text}</div>)}
        </div>}
      </div>
    </div>
  </div>;
}

export default ItemCard;