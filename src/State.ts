import React from 'react';
import {
  faMousePointer,
  faVectorSquare,
  faDrawPolygon,
  faCircle,
  faBrush
} from '@fortawesome/free-solid-svg-icons'
import { produce } from 'immer';

export interface Pos {
  x: number
  y: number
}

export const initialState = {
  tools: {
    'pointer': {
      icon: faMousePointer,
      selected: true,
    },
    'brush': {
      icon: faBrush,
      selected: false,
    },
    'box': {
      icon: faVectorSquare,
      selected: false,
    },
    'polygon': {
      icon: faDrawPolygon,
      selected: false,
    },
    'circle': {
      icon: faCircle,
      selected: false,
    },
  },
  map: {},
  setState: (state: any) => { },
};

type InitialState = typeof initialState;

export interface State extends InitialState {
  map: { [key: number]: { [key: number]: boolean } }
}

export function setSelectedTool(state: State, tool: string) {
  state.setState(produce(state, state => {
    Object.values(state.tools).forEach(tool => { tool.selected = false; });
    (state.tools as any)[tool].selected = true;
  }));
}

export function setTile(state: State, loc: Pos) {
  state.setState(produce(state, state => {
    if (state.map[loc.x] === undefined) {
      state.map[loc.x] = {};
    }
    state.map[loc.x][loc.y] = true;
  }));
}

export const Context = React.createContext(initialState as State);