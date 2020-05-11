import React from 'react';

import { Spritesheet } from './AssetService';

interface Props {
  id: string,
  Spritesheets: Spritesheet[],
  onSelection: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

export default function SpritesheetSelector(props: Props) {
  return <select className="form-control" id={props.id} onChange={props.onSelection}>
    <option></option>
    {props.Spritesheets.map(spritesheet => <option key={`${props.id}-${spritesheet.Name}`} value={spritesheet.ID}>{spritesheet.Name}</option>)}
  </select >;
}