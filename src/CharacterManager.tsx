import React from 'react';
import produce from 'immer';

import CampaignService, { Character } from './CampaignService';

interface State {
  Characters: Character[]
  editing: { [key: string]: boolean }
}

export default class CharacterManager extends React.Component<State, State> {

  constructor(props: State) {
    super(props);
    this.state = {
      ...props,
      editing: {},
    };
    if (!props.Characters) {
      CampaignService.ListCharacters({}).then(resp => {
        this.setState(produce(this.state, state => {
          state.Characters = resp.Characters || [];
        }));
      });
    }
  }

  onEditClicked = (character: Character) => (event: React.MouseEvent<HTMLButtonElement>) => {
  }

  onDeleteClicked = (character: Character) => (event: React.MouseEvent<HTMLButtonElement>) => {
  }

  render() {
    return <div className="container">
      {this.state.Characters.map(character => <div className="card" key={character.Name}>
        <div className="card-body">
          <h5 className="card-title">{character.Name}</h5>
          <p className="card-text"></p>
          <button className="btn btn-secondary" onClick={this.onEditClicked(character)}>Edit</button>
          <button className="btn btn-danger" onClick={this.onDeleteClicked(character)}>Delete</button>
        </div>
      </div>)}
    </div>;
  }
}