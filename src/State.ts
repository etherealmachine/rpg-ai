import React from 'react';
import { produce } from 'immer';

export interface Pos {
  x: number
  y: number
}

function modify() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const modifierFn = descriptor.value;
    descriptor.value = function () {
      const args = Array.from(arguments);
      (this as any).setState(produce(this, (newTarget: any) => {
        modifierFn.bind(newTarget)(...args);
      }));
    };
  };
}

export class State {
  tools = {
    'pointer': {
      selected: true,
      group: 1,
    },
    'walls': {
      selected: false,
      group: 1,
    },
    'stairs': {
      selected: false,
      group: 1,
    },
    'doors': {
      selected: false,
      group: 1,
    },
    'text': {
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
    'ellipse': {
      selected: false,
      group: 2,
    },
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

  @modify()
  addGeometry(geometry: Geometry) {
    this.layers[this.selection.layerIndex].geometries.push(geometry);
  }

  @modify()
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

  @modify()
  setSelection(selection: { layerIndex: number, geometryIndex: undefined | number }) {
    this.selection = selection;
  }

  @modify()
  setOffset(offset: Pos) {
    this.offset = offset;
  }

  @modify()
  setZoom(scale: number, offset: Pos) {
    this.scale = scale;
    this.offset = offset;
  }

  @modify()
  toggleDrawer(open: boolean) {
    this.drawerOpen = open;
  }

  @modify()
  setDescription(desc: Description | undefined) {
    if (this.selection.geometryIndex === undefined) return;
    this.layers[this.selection.layerIndex].geometries[this.selection.geometryIndex].description = desc;
  }

  @modify()
  reset() {
    Object.assign(this, new State());
  }
}

export interface Geometry {
  type: 'room'
  description?: Description
  shape: Shape
}

export interface Layer {
  geometries: Geometry[]
}

export type Shape = { type: 'rect', from: Pos, to: Pos } | { type: 'polygon', points: Pos[] } | { type: 'ellipse', from: Pos, to: Pos }

export interface Description {
  name: string
  description: string
}

export const Context = React.createContext(new State());
