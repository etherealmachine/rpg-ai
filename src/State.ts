import React from 'react';
import {
  faMousePointer,
  faVectorSquare,
  faDrawPolygon,
  faCircle,
  faBrush
} from '@fortawesome/free-solid-svg-icons'
import { produce } from 'immer';

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
  setState: (state: any) => { },
};

export type State = typeof initialState;

export function setSelectedTool(state: State, tool: string) {
  state.setState(produce(state, state => {
    Object.values(state.tools).forEach(tool => { tool.selected = false; });
    (state.tools as any)[tool].selected = true;
  }));
}

export const Context = React.createContext(initialState);