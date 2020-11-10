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
      group: 1,
    },
    'brush': {
      selected: false,
      group: 1,
    },
    'eraser': {
      selected: false,
      group: 1,
    },
    'rect': {
      selected: false,
      group: 2,
    },
    'polygon': {
      selected: false,
      group: 2,
    },
    'circle': {
      selected: false,
      group: 2,
    },
    'text': {
      selected: false,
      group: 2,
    },
    'stairs': {
      selected: false,
      group: 2,
    },
    'doors': {
      selected: false,
      group: 2,
    }
  },
  scale: 1,
  offset: { x: 0, y: 0 },
  map: new TileMap<boolean>(),
  roomDescriptions: [] as RoomDescription[],
  setState: (state: any) => { },
};

type InitialStateType = typeof initialState;

type Shape = { type: 'rect', from: Pos, to: Pos } | { type: 'polygon', points: Pos[] } | { type: 'oval', from: Pos, to: Pos }

interface RoomDescription {
  name: string
  description: string
  shape: Shape
  selected: boolean
}

export interface State extends InitialStateType {
  selection?: Shape
}

export function setSelectedTool(state: State, name: string) {
  state.setState(produce(state, state => {
    const tool = (state.tools as any)[name];
    if (tool.selected) {
      tool.selected = false;
      return;
    }
    Object.values(state.tools).forEach(t => {
      if (t.group === tool.group) t.selected = false;
    });
    tool.selected = true;
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

export function setSelection(state: State, selection: undefined | Shape) {
  state.setState(produce(state, state => {
    state.selection = selection;
  }));
}

export function setOffset(state: State, offset: Pos) {
  state.setState(produce(state, state => {
    state.offset = offset;
  }));
}

export function setZoom(state: State, scale: number, offset: Pos) {
  state.setState(produce(state, state => {
    state.scale = scale;
    state.offset = offset;
  }));
}

export function addRoomDescription(state: State, desc: RoomDescription) {
  state.setState(produce(state, state => {
    state.roomDescriptions.forEach(desc => desc.selected = false);
    state.roomDescriptions.push(desc);
  }));
}

export function selectRoom(state: State, index: number) {
  state.setState(produce(state, state => {
    state.roomDescriptions.forEach(desc => desc.selected = false);
    if (index >= 0 && index < state.roomDescriptions.length) {
      state.roomDescriptions[index].selected = true;
    }
  }));
}

export function updateRoom(state: State, index: number, desc: RoomDescription) {
  state.setState(produce(state, state => {
    state.roomDescriptions[index] = desc;
  }));
}

export function deleteRoom(state: State, index: number) {
  state.setState(produce(state, state => {
    state.roomDescriptions.splice(index, 1);
  }));
}

export const Context = React.createContext(initialState as State);