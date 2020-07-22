import React from 'react';
import produce from 'immer';

import CampaignService, { FilledCampaign } from './CampaignService';

interface State {
  Campaigns: FilledCampaign[]
  editing: { [key: string]: boolean }
}

export default class CampaignManager extends React.Component<State, State> {

  constructor(props: State) {
    super(props);
    this.state = {
      ...props,
      editing: {},
    };
    if (!props.Campaigns) {
      CampaignService.ListCampaigns({}).then(resp => {
        this.setState(produce(this.state, state => {
          state.Campaigns = resp.Campaigns || [];
        }));
      });
    }
  }

  render() {
    return <div className="container">
      {this.state.Campaigns.map(campaign => <div className="card" key={campaign.Name}>
        <div className="card-body">
          <h5 className="card-title">{campaign.Name}</h5>
          <p className="card-text">{campaign.Description.String}</p>
        </div>
      </div>)}
    </div>;
  }
}