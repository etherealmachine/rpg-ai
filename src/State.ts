import React from 'react';
import { produce } from 'immer';

export interface Pos {
  x: number
  y: number
}

class TileMap<TileType> {
  map: { [key: number]: { [key: number]: TileType } } = {}

  get(x: number, y: number): TileType | undefined {
    if (this.map[x] && this.map[x][y] !== undefined) {
      return this.map[x][y];
    }
    return undefined;
  }

  set(x: number, y: number, value: TileType) {
    if (this.map[x] === undefined) this.map[x] = {};
    this.map[x][y] = value;
  }

  forEach(callback: (currentValue: TileType, index: Pos, array: TileMap<TileType>) => void) {
    Object.entries(this.map).forEach(([x, col]) => Object.entries(col).forEach(([y, value]) => {
      callback(value, { x: parseInt(x), y: parseInt(y) }, this);
    }));
  }
}

export const initialState = {
  tools: {
    'pointer': {
      selected: true,
    },
    'brush': {
      selected: false,
    },
    'eraser': {
      selected: false,
    },
    'box': {
      selected: false,
    },
    'polygon': {
      selected: false,
    },
    'circle': {
      selected: false,
    },
  },
  map: new TileMap<boolean>(),
  setState: (state: any) => { },
};

type InitialState = typeof initialState;

export interface State extends InitialState {
}

export function setSelectedTool(state: State, tool: string) {
  state.setState(produce(state, state => {
    Object.values(state.tools).forEach(tool => { tool.selected = false; });
    (state.tools as any)[tool].selected = true;
  }));
}

export function setTile(state: State, loc: Pos) {
  state.setState(produce(state, state => {
    state.map.set(loc.x, loc.y, true);
  }));
}

export function clearTile(state: State, loc: Pos) {
  state.setState(produce(state, state => {
    state.map.set(loc.x, loc.y, false);
  }));
}

export const Context = React.createContext(initialState as State);