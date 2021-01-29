import React from 'react';

function Interactable(props: { [key: string]: any }) {
  return <div className="card">
    <div className="card-body">
      <h5 className="card-title">{props['name']}</h5>
      <p className="card-text">{props['description']}</p>
      <ul>
        {Object.entries(props).filter(([key, _]) => !['name', 'description', 'actions'].includes(key)).map(
          ([key, value]) => <li key={key}>{key}: {JSON.stringify(value)}</li>
        )}
      </ul>
      {props.actions.map(action =>
        <button key={action.name} className="btn btn-primary" onClick={action.handler}>{action.name}</button>
      )}
    </div>
  </div>;
}

export default Interactable;