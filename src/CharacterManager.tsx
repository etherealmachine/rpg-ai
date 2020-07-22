import React from 'react';
import produce from 'immer';

import CampaignService, { Character } from './CampaignService';

interface State {
  Characters: Character[] | null
  editing: { [key: number]: boolean }
  NewCharacter: {
    Name: string,
    Definition?: string,
  }
}

export default class CharacterManager extends React.Component<State, State> {

  constructor(props: State) {
    super(props);
    this.state = {
      ...props,
      editing: {},
      NewCharacter: {
        Name: "",
      }
    };
    if (!props.Characters) {
      this.updateCharactersList();
    }
  }

  updateCharactersList = () => {
    CampaignService.ListCharacters({}).then(resp => {
      this.setState(produce(this.state, state => {
        state.Characters = resp.Characters || [];
      }));
    });
  }

  onCreateClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    CampaignService.CreateCharacter({
      OwnerID: -1,
      Name: this.state.NewCharacter.Name,
      Definition: this.state.NewCharacter.Definition || ""
    }).then(() => {
      this.setState(produce(this.state, state => {
        state.NewCharacter.Name = "";
        state.NewCharacter.Definition = undefined;
      }));
      this.updateCharactersList();
    });
  }

  onNameChange = (character?: Character) => (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (!character) {
      this.setState(produce(this.state, state => {
        state.NewCharacter.Name = event.target.value;
      }));
    } else {
      this.setState(produce(this.state, state => {
        if (state.Characters) {
          state.Characters.forEach(char => {
            if (char.ID === character.ID) {
              char.Name = event.target.value;
            }
          })
        }
      }));
    }
  }

  onEditClicked = (character: Character) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[character.ID] = true;
    }));
  }

  onCancelClicked = (character: Character) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[character.ID] = false;
    }));
  }

  onSaveClicked = (character: Character) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.UpdateCharacter({
      OwnerID: -1,
      ID: character.ID,
      Name: character.Name,
    }).then(() => {
      this.setState(produce(this.state, state => {
        state.editing[character.ID] = false;
      }));
      this.updateCharactersList();
    });
  }

  onDeleteClicked = (character: Character) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.DeleteCharacter({
      OwnerID: -1,
      ID: character.ID,
    }).then(this.updateCharactersList);
  }

  render() {
    return <div className="container">
      {this.state.Characters && this.state.Characters.map(character => <div className="card" key={character.ID}>
        <div className="card-body">
          {this.state.editing[character.ID] ?
            <input className="form-control" value={character.Name} onChange={this.onNameChange(character)} /> :
            <h5 className="card-title">{character.Name}</h5>
          }
          <p className="card-text"></p>
          {this.state.editing[character.ID] ?
            <div className="d-flex justify-content-between">
              <div className="d-flex">
                <button className="btn btn-primary" onClick={this.onSaveClicked(character)}>Save</button>
                <button className="btn btn-secondary" onClick={this.onCancelClicked(character)}>Cancel</button>
              </div>
              <button className="btn btn-danger" onClick={this.onDeleteClicked(character)}>Delete</button>
            </div> :
            <button className="btn btn-secondary" onClick={this.onEditClicked(character)}>Edit</button>
          }
        </div>
      </div>)}
      <div className="card">
        <form className="card-body">
          <h5 className="card-title">Create Character</h5>
          <div className="form-group">
            <label htmlFor="Name">Name</label>
            <input name="Name" className="form-control" value={this.state.NewCharacter.Name} onChange={this.onNameChange(undefined)} />
          </div>
          <button type="submit" className="btn btn-primary" onClick={this.onCreateClicked}>Create</button>
        </form>
      </div>
    </div >;
  }
}