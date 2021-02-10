import React from 'react';
import ReactMarkdown from 'react-markdown';

import CharacterCard from './CharacterCard';
import NPCCard from './NPCCard';

function Encounter(props: any) {
  return <div>
    <ReactMarkdown>{`
# Encounters
The Encounter tracker manages a combat encounter between one or more Characters and one or more NPCs.

Each Character and NPC has their own card showing the stats and actions available.

The Character/NPC card gets customized based on who's viewing the card, for example:

1. The DM can see the NPC's full health and available actions and spells and has buttons to click to start casting a spell or trigger an action or reaction.
2. Characters can see if the NPC is bloodied or has a condition applied to them, as well as past actions they've taken.
3. Characters get buttons on their own card to trigger actions, cast spells, make checks/saves, etc.‍

There's also an initiative tracker, everyone gets automatically rolled into the initiative order when they join the encounter and the DM or character can pass the initiative on to the next player.
    `}</ReactMarkdown>
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