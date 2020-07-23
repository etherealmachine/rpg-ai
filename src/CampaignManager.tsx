import React from 'react';
import produce from 'immer';

import CampaignService, { FilledCampaign, FilledEncounter, Character } from './CampaignService';
import { FilledTilemap } from './AssetService';

interface State {
  Campaigns: FilledCampaign[] | null
  Characters: Character[] | null
  Tilemaps: FilledTilemap[] | null
  editing: { [key: number]: boolean }
  editingEncounter: { [key: number]: boolean }
  newCampaign: {
    Name: string,
  },
  newEncounters: { [key: number]: { Name: string, Description: string | null, TilemapID: number | null } | null }
  suggestedCharacters: Character[],
  characterQuery: string,
}

export default class CampaignManager extends React.Component<State, State> {

  constructor(props: State) {
    super(props);
    this.state = {
      ...props,
      editing: {},
      editingEncounter: {},
      newCampaign: {
        Name: '',
      },
      newEncounters: {},
      suggestedCharacters: [],
      characterQuery: '',
    };
    if (!props.Campaigns) {
      this.updateCampaignsList();
    }
  }

  updateCampaignsList = () => {
    CampaignService.ListCampaigns({}).then(resp => {
      this.setState(produce(this.state, state => {
        state.Campaigns = resp.Campaigns || [];
      }));
    });
  }

  onCreateClicked = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    CampaignService.CreateCampaign({
      OwnerID: -1,
      Name: this.state.newCampaign.Name,
      Description: {
        String: '',
        Valid: false,
      },
    }).then(() => {
      this.setState(produce(this.state, state => {
        state.newCampaign.Name = "";
      }));
      this.updateCampaignsList();
    });
  }

  onChange = (campaign: FilledCampaign | null, attr: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    event.preventDefault();
    if (!campaign) {
      this.setState(produce(this.state, state => {
        (state.newCampaign as any)[attr] = event.target.value;
      }));
    } else {
      this.setState(produce(this.state, state => {
        if (state.Campaigns) {
          state.Campaigns.forEach(c => {
            if (c.ID === campaign.ID) {
              (c as any)[attr] = event.target.value;
            }
          })
        }
      }));
    }
  }

  onEditClicked = (campaign: FilledCampaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[campaign.ID] = true;
    }));
  }

  onCancelClicked = (campaign: FilledCampaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[campaign.ID] = false;
    }));
  }

  onSaveClicked = (campaign: FilledCampaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.UpdateCampaign({
      OwnerID: -1,
      ID: campaign.ID,
      Name: campaign.Name,
      Description: campaign.Description,
    }).then(() => {
      this.setState(produce(this.state, state => {
        state.editing[campaign.ID] = false;
      }));
      this.updateCampaignsList();
    });
  }

  onDeleteClicked = (campaign: FilledCampaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.DeleteCampaign({
      OwnerID: -1,
      ID: campaign.ID,
    }).then(this.updateCampaignsList);
  }

  onEncounterSaveClicked = (encounter: FilledEncounter) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.UpdateEncounter({
      OwnerID: -1,
      ID: encounter.ID,
      Name: encounter.Name,
      Description: encounter.Description,
      TilemapID: encounter.TilemapID,
    }).then(() => {
      this.setState(produce(this.state, state => {
        state.editingEncounter[encounter.ID] = false;
      }));
      this.updateCampaignsList();
    });
  }

  onEncounterEditClicked = (encounter: FilledEncounter) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editingEncounter[encounter.ID] = true;
    }));
  }

  onEncounterCancelClicked = (encounter: FilledEncounter) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editingEncounter[encounter.ID] = false;
    }));
  }

  onEncounterDeleteClicked = (encounter: FilledEncounter) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.DeleteEncounter({
      OwnerID: -1,
      ID: encounter.ID,
    }).then(this.updateCampaignsList);
  }

  onEncounterChange = (campaign: FilledCampaign, encounter: FilledEncounter | null, attr: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    event.preventDefault();
    if (!encounter) {
      this.setState(produce(this.state, state => {
        if (!state.newEncounters[campaign.ID]) {
          state.newEncounters[campaign.ID] = {
            Name: '',
            Description: null,
            TilemapID: null,
          }
        }
        (state.newEncounters[campaign.ID] as any)[attr] = event.target.value;
      }));
    } else {
      this.setState(produce(this.state, state => {
        if (state.Campaigns) {
          state.Campaigns.forEach(c => {
            if (c.ID === campaign.ID) {
              if (c.Encounters) {
                c.Encounters.forEach(e => {
                  if (e.ID === encounter.ID) {
                    if ((e as any)[attr].hasOwnProperty('String')) {
                      (e as any)[attr]['String'] = event.target.value;
                    } else if ((e as any)[attr].hasOwnProperty('Int32')) {
                      (e as any)[attr]['Int32'] = event.target.value;
                    } else {
                      (e as any)[attr] = event.target.value;
                    }
                  }
                });
              }
            }
          })
        }
      }));
    }
  }

  onCreateEncounterClicked = (campaign: FilledCampaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const newEncounter = this.state.newEncounters[campaign.ID];
    CampaignService.CreateEncounter({
      OwnerID: -1,
      CampaignID: campaign.ID,
      Name: newEncounter?.Name || '',
      Description: newEncounter?.Description ? { String: newEncounter.Description, Valid: true } : { String: '', Valid: false },
      TilemapID: { Int32: 0, Valid: false },
    }).then(() => {
      this.setState(produce(this.state, state => {
        state.newEncounters[campaign.ID] = null;
      }));
      this.updateCampaignsList();
    });
  }

  onCharacterQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState(produce(this.state, state => {
      state.characterQuery = event.target.value;
    }));
    CampaignService.SearchCharacters({
      Name: '%' + event.target.value + '%',
    }).then(resp => {
      this.setState(produce(this.state, state => {
        state.suggestedCharacters = resp.Characters || [];
      }));
    });
  }

  onAddCharacterToEncounter = (encounter: FilledEncounter, character: Character) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.AddCharacterToEncounter({
      OwnerID: -1,
      EncounterID: encounter.ID,
      CharacterID: character.ID,
    }).then(this.updateCampaignsList);
  }

  onRemoveCharacterFromEncounter = (encounter: FilledEncounter, character: Character) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.RemoveCharacterFromEncounter({
      OwnerID: -1,
      EncounterID: encounter.ID,
      CharacterID: character.ID,
    }).then(this.updateCampaignsList);

  }

  render() {
    return <div className="container">
      {this.state.Campaigns && this.state.Campaigns.map(campaign => <div className="card" key={campaign.ID}>
        <div className="card-body">
          {this.state.editing[campaign.ID] ?
            <div>
              <input className="form-control" value={campaign.Name} onChange={this.onChange(campaign, 'Name')} />
              <textarea className="form-control" value={campaign.Description.String} onChange={this.onChange(campaign, 'Description')} />
              <div className="d-flex justify-content-between">
                <div className="d-flex">
                  <button className="btn btn-primary" onClick={this.onSaveClicked(campaign)}>Save</button>
                  <button className="btn btn-secondary" onClick={this.onCancelClicked(campaign)}>Cancel</button>
                </div>
                <button className="btn btn-danger" onClick={this.onDeleteClicked(campaign)}>Delete</button>
              </div>
            </div> :
            <div>
              <h5 className="card-title">{campaign.Name}</h5>
              <p className="card-text">{campaign.Description.String}</p>
              <button className="btn btn-secondary" onClick={this.onEditClicked(campaign)}>Edit</button>
            </div>
          }
          <h6>Encounters</h6>
          {campaign.Encounters?.map(encounter => <div className="card" key={encounter.Name}>
            <div className="card-body">
              {this.state.editingEncounter[encounter.ID] ?
                <div>
                  <input className="form-control" value={encounter.Name} onChange={this.onEncounterChange(campaign, encounter, 'Name')} />
                  <textarea className="form-control" value={encounter.Description.String} onChange={this.onEncounterChange(campaign, encounter, 'Description')} />
                  <div className="form-group">
                    {encounter.Characters?.map(character => <div className="card" key={character.ID}>
                      <div className="card-body">
                        <h5 className="card-title">{character.Name}</h5>
                        <button className="btn btn-danger" onClick={this.onRemoveCharacterFromEncounter(encounter, character)}><i className="fa fa-minus" aria-hidden="true"></i></button>
                      </div>
                    </div>)}
                  </div>
                  <div className="form-group">
                    <label htmlFor="AddCharacter">Add Character</label>
                    <input name="AddCharacter" className="form-control" onChange={this.onCharacterQueryChange} />
                    <div className="d-flex">
                      {this.state.suggestedCharacters.map(character => <div className="card" key={character.ID}>
                        <div className="card-body">
                          <h5 className="card-title">{character.Name}</h5>
                          <button className="btn btn-success" onClick={this.onAddCharacterToEncounter(encounter, character)}><i className="fa fa-plus" aria-hidden="true"></i></button>
                        </div>
                      </div>)}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between">
                    <div className="d-flex">
                      <button className="btn btn-primary" onClick={this.onEncounterSaveClicked(encounter)}>Save</button>
                      <button className="btn btn-secondary" onClick={this.onEncounterCancelClicked(encounter)}>Cancel</button>
                    </div>
                    <button className="btn btn-danger" onClick={this.onEncounterDeleteClicked(encounter)}>Delete</button>
                  </div>
                </div> :
                <div>
                  <h5 className="card-title">{encounter.Name}</h5>
                  <p className="card-text">{encounter.Description.String}</p>
                  <button className="btn btn-secondary" onClick={this.onEncounterEditClicked(encounter)}>Edit</button>
                </div>
              }
            </div>
          </div>)}
          <div className="card">
            <form className="card-body">
              <h5 className="card-title">Add Encounter</h5>
              <div className="form-group">
                <label htmlFor="Name">Name</label>
                <input name="Name" className="form-control" value={this.state.newEncounters[campaign.ID]?.Name || ''} onChange={this.onEncounterChange(campaign, null, 'Name')} />
              </div>
              <div className="form-group">
                <label htmlFor="Description">Description</label>
                <textarea name="Description" className="form-control" value={this.state.newEncounters[campaign.ID]?.Description || ''} onChange={this.onEncounterChange(campaign, null, 'Description')} />
              </div>
              <div className="form-group">
                <label htmlFor="Tilemap">Tilemap</label>
                <select name="Tilemap" className="form-control" onChange={this.onEncounterChange(campaign, null, 'TilemapID')}>
                  {this.state.Tilemaps && this.state.Tilemaps.map(tilemap => <option value={tilemap.ID} key={tilemap.ID}>
                    {tilemap.Name}
                  </option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" onClick={this.onCreateEncounterClicked(campaign)}>Create</button>
            </form>
          </div>
        </div>
      </div>)}
      <div className="card">
        <form className="card-body">
          <h5 className="card-title">Create Campaign</h5>
          <div className="form-group">
            <label htmlFor="Name">Name</label>
            <input name="Name" className="form-control" value={this.state.newCampaign.Name} onChange={this.onChange(null, 'Name')} />
          </div>
          <button type="submit" className="btn btn-primary" onClick={this.onCreateClicked}>Create</button>
        </form>
      </div>
    </div>;
  }
}