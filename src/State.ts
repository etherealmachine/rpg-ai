import React from 'react';
import { produce } from 'immer';

export interface Pos {
  x: number
  y: number
}

export class State {
  tools = {
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
    'walls': {
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
  }
  scale = 1
  offset = { x: 0, y: 0 }
  layers = [{
    geometries: [],
  }] as Layer[]
  drawerOpen = true
  selection = {
    layerIndex: 0 as number,
    geometryIndex: undefined as number | undefined
  }
  setState = (state: any) => { }

  getSelectedGeometry() {
    if (this.selection.geometryIndex === undefined) return undefined;
    return this.layers[this.selection.layerIndex].geometries[this.selection.geometryIndex];
  }

  setSelectedTool(name: string) {
    const tool = (this.tools as any)[name];
    if (tool.selected) {
      tool.selected = false;
      return;
    }
    Object.values(this.tools).forEach(t => {
      if (t.group === tool.group) t.selected = false;
    });
    tool.selected = true;
  }

  setSelection(selection: { layerIndex: number, geometryIndex: undefined | number }) {
    this.selection = selection;
  }

  setOffset(offset: Pos) {
    this.offset = offset;
  }

  setZoom(scale: number, offset: Pos) {
    this.scale = scale;
    this.offset = offset;
  }

  toggleDrawer(open: boolean) {
    this.drawerOpen = open;
  }

  setDescription(desc: Description | undefined) {
    if (this.selection.geometryIndex === undefined) return;
    this.layers[this.selection.layerIndex].geometries[this.selection.geometryIndex].description = desc;
  }
};

interface Geometry {
  type: 'room'
  description?: Description
  shape: Shape
  selected: boolean
}

interface Layer {
  geometries: Geometry[]
}

type Shape = { type: 'rect', from: Pos, to: Pos } | { type: 'polygon', points: Pos[] } | { type: 'oval', from: Pos, to: Pos }

interface Description {
  name: string
  description: string
}

const StateChangeHandler = {
  get: function (target: any, prop: any, receiver: any) {
    console.log(target, prop, receiver);
    return Reflect.get(target, prop, receiver);
  }
};

export const Context = React.createContext(new Proxy(new State(), StateChangeHandler) as State);