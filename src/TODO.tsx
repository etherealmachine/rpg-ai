import React from 'react';

const Items = [
  {
    version: 'Grid-based mapping tool',
    description: 'Goal: Draw a map of a keep with three levels and several rooms.',
    features: {
      'Draw rectangles': true,
      'Draw polygons': true,
      'Draw ovals': true,
      'Paint with brush': true,
      'Zoom and scroll': true,
      'Doors': true,
      'Stairs': true,
      'Set name': true,
      'Save/load': true,
      'Describe area': true,
      'Undo/redo': true,
      'Multiple levels': false,
      'Text boxes': false,
      'Print': false,
    },
  },
  {
    version: 'Extra functionality',
    description: 'Goal: Add NPCs and objects to the map, plus some color esp. for outdoor areas',
    features: {
      'Tokens': false,
      'Objects': false,
      'Secret doors': false,
      'Isometric view': false,
      'Outdoor areas': false,
      'Paintable terrain': false,
    }
  },
  {
    version: 'Fully playable',
    description: 'Goal: Bring 3-4 players together on a shared map that is easy to operate and extend on the fly',
    features: {
      'Invisible creatures': false,
      'Token movement': false,
      'Line of sight': false,
      'NPC database': false,
      'Character sheets': false,
      'NPC interactions': false,
      'Combat mechanics': false,
      'NPC AI': false,
      'Particle effects': false,
      'Hexagonal maps': false,
    },
  }
]

export default function TODO() {
  return <React.Fragment>
    <h2>TODO List</h2>
    {Object.entries(Items).map(([version, todos]) => <div key={version}>
      <h3>{todos.version}</h3>
      <div style={{ display: 'flex' }}>
        <ul>
          {Object.entries(todos.features).map(([item, done]) => <li key={item}>
            <input type="checkbox" checked={done} readOnly />
            <span>{item}</span>
          </li>)}
        </ul>
        <p>{todos.description}</p>
      </div>
    </div>)}
  </React.Fragment>;
}