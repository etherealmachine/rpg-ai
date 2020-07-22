import React from 'react';
import produce from 'immer';

import CampaignService, { FilledCampaign, Campaign } from './CampaignService';

interface State {
  Campaigns: FilledCampaign[] | null
  editing: { [key: number]: boolean }
  NewCampaign: {
    Name: string,
  }
}

export default class CampaignManager extends React.Component<State, State> {

  constructor(props: State) {
    super(props);
    this.state = {
      ...props,
      editing: {},
      NewCampaign: {
        Name: '',
      }
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
      Name: this.state.NewCampaign.Name,
      Description: {
        String: '',
        Valid: false,
      },
    }).then(() => {
      this.setState(produce(this.state, state => {
        state.NewCampaign.Name = "";
      }));
      this.updateCampaignsList();
    });
  }

  onChange = (campaign: FilledCampaign | null, attr: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    event.preventDefault();
    if (!campaign) {
      this.setState(produce(this.state, state => {
        (state.NewCampaign as any)[attr] = event.target.value;
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

  onEditClicked = (campaign: Campaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[campaign.ID] = true;
    }));
  }

  onCancelClicked = (campaign: Campaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState(produce(this.state, state => {
      state.editing[campaign.ID] = false;
    }));
  }

  onSaveClicked = (campaign: Campaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
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

  onDeleteClicked = (campaign: Campaign) => (event: React.MouseEvent<HTMLButtonElement>) => {
    CampaignService.DeleteCampaign({
      OwnerID: -1,
      ID: campaign.ID,
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
          <h6>Cast</h6>
          {campaign.Characters?.map(campaign => <div className="card" key={campaign.Name}>
          </div>)}
        </div>
      </div>)}
      <div className="card">
        <form className="card-body">
          <h5 className="card-title">Create Campaign</h5>
          <div className="form-group">
            <label htmlFor="Name">Name</label>
            <input name="Name" className="form-control" value={this.state.NewCampaign.Name} onChange={this.onChange(null, 'Name')} />
          </div>
          <button type="submit" className="btn btn-primary" onClick={this.onCreateClicked}>Create</button>
        </form>
      </div>
    </div>;
  }
}