import React from 'react';
import ReactMarkdown from 'react-markdown';

import CharacterCard from './CharacterCard';
import NPCCard from './NPCCard';

function Encounter(props: any) {
  return <div>
    <div className="d-flex mb-4">
      <input type="text" className="form-control" list="options" placeholder="Search" />
      <button className="btn btn-primary">Add</button>
      <datalist id="options">{props.search_terms.map(term => <option key={term} value={term} />)}</datalist>
    </div>
    <div className="d-flex flex-wrap justify-content-between">
      {props.characters.map(c => c.monster ? <NPCCard key={c.name} npc={c} /> : <CharacterCard key={c.name} character={c} />)}
    </div>
  </div>;
}

export default Encounter;