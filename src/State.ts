import React from 'react';
import { produce } from 'immer';
import { detectStairsPlacement, DoorPlacement } from './lib';

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

const initialTools = () => ({
  'pointer': {
    selected: true,
    group: 0,
    polygon: true,
    disabled: false,
  },
  'walls': {
    selected: false,
    group: 1,
    polygon: true,
    disabled: false,
  },
  'stairs': {
    selected: false,
    group: 1,
    polygon: false,
    disabled: false,
  },
  'doors': {
    selected: false,
    group: 1,
    polygon: false,
    disabled: false,
  },
  'brush': {
    selected: false,
    group: 2,
    polygon: true,
    disabled: false,
  },
  'rect': {
    selected: false,
    group: 2,
    polygon: true,
    disabled: false,
  },
  'polygon': {
    selected: false,
    group: 2,
    polygon: true,
    disabled: false,
  },
  'ellipse': {
    selected: false,
    group: 2,
    polygon: true,
    disabled: false,
  },
});

export type ToolName = keyof ReturnType<typeof initialTools>;

export class State {
  tools = initialTools()
  scale = 1
  offset = [0, 0]
  levels = [{
    features: [],
  }] as Layer[]
  drawerOpen = false
  selection = {
    layerIndex: 0 as number,
    featureIndex: undefined as number | undefined
  }
  debug = false
  modalOpen = true
  setState = (state: any) => { }

  getSelectedFeature(i?: number): Feature | undefined {
    if (i === undefined) i = this.selection.featureIndex;
    if (i === undefined) return undefined;
    return this.levels[this.selection.layerIndex].features[i];
  }

  @modify()
  toggleModal() {
    this.modalOpen = !this.modalOpen;
  }

  @modify()
  newMap() {
    this.levels = [{ features: [] }];
    this.selection = { layerIndex: 0, featureIndex: undefined };
    this.scale = 1;
    this.offset = [0, 0];
  }

  @modify()
  setDebug(debug: boolean) {
    this.debug = debug;
  }

  @modify()
  handleDrag(from: number[], to: number[]) {
    if (from[0] === to[0] && from[1] === to[1]) return;
    const features = this.levels[this.selection.layerIndex].features;
    if (this.selection.featureIndex !== undefined) {
      const selection = features[this.selection.featureIndex];
      if (selection !== undefined) {
        const deltaDrag = [to[0] - from[0], to[1] - from[1]];
        selection.geometries.forEach(geometry => {
          geometry.coordinates.forEach(p => {
            p[0] += deltaDrag[0];
            p[1] += deltaDrag[1];
          });
        });
        return;
      }
    }
    if (this.tools.stairs.selected) {
      const stairs = detectStairsPlacement(from, to, features);
      if (stairs) {
        features[stairs.feature].geometries.push({
          type: 'stairs',
          coordinates: [from, to],
        });
      }
    } else if (this.tools.rect.selected) {
      features.push({
        geometries: [{
          type: 'polygon',
          coordinates: [[from[0], from[1]], [from[0], to[1]], [to[0], to[1]], [to[0], from[1]]],
        }],
        properties: {
          type: 'room',
        },
      });
    } else if (this.tools.ellipse.selected) {
      features.push({
        geometries: [{
          type: 'ellipse',
          coordinates: [from, to],
        }],
        properties: {
          type: 'room',
        },
      });
    }
  }

  @modify()
  handlePolygon(points: number[][]) {
    const features = this.levels[this.selection.layerIndex].features;
    if (this.tools.walls.selected) {
      features.push({
        geometries: [{
          type: 'polygon',
          coordinates: points,
        }],
        properties: {
          type: 'room',
        },
      });
    }
  }

  @modify()
  handleBrush(points: number[][]) {
    const features = this.levels[this.selection.layerIndex].features;
    if (this.tools.walls.selected && this.tools.brush.selected) {
      features.push({
        geometries: [{
          type: 'brush',
          coordinates: points,
        }],
        properties: {
          type: 'room',
        },
      });
    }
  }

  @modify()
  handleDelete() {
    const features = this.levels[this.selection.layerIndex].features;
    if (this.selection.featureIndex === undefined) return;
    features.splice(this.selection.featureIndex, 1);
    this.selection.featureIndex = undefined;
  }

  @modify()
  addDoor(door: DoorPlacement) {
    const feature = this.levels[this.selection.layerIndex].features[door.feature];
    feature.geometries.push({
      type: 'door',
      coordinates: [door.from, door.to],
    });
  }

  @modify()
  group(i: number, j: number) {
    const features = this.levels[this.selection.layerIndex].features;
    features[i].geometries = features[i].geometries.concat(features[j].geometries);
    features.splice(j, 1);
  }

  @modify()
  setSelectedTool(name: ToolName) {
    const tool = this.tools[name];
    if (tool.selected) {
      tool.selected = false;
      return;
    }
    if (tool.group === 0) {
      Object.values(this.tools).forEach(t => {
        t.selected = false;
      });
      tool.selected = true;
      return;
    } else {
      Object.values(this.tools).forEach(t => {
        if (t.group === 0) t.selected = false;
      });
    }
    Object.values(this.tools).forEach(t => {
      if (t.group === tool.group) t.selected = false;
    });
    if (!tool.polygon) {
      Object.values(this.tools).forEach(t => {
        if (t.group === 2) {
          t.selected = false;
          t.disabled = true;
        }
      });
    } else {
      Object.values(this.tools).forEach(t => {
        if (t.group === 2) {
          t.disabled = false;
        }
      });
    }
    tool.selected = true;
  }

  @modify()
  setSelection(selection: { layerIndex: number, featureIndex: undefined | number }) {
    this.selection = selection;
  }

  @modify()
  setOffset(offset: number[]) {
    this.offset = offset;
  }

  @modify()
  setZoom(scale: number, offset: number[]) {
    this.scale = scale;
    this.offset = offset;
  }

  @modify()
  toggleDrawer(open: boolean) {
    this.drawerOpen = open;
  }

  @modify()
  setDescription(desc: Description | undefined) {
    if (this.selection.featureIndex === undefined) return;
    const feature = this.levels[this.selection.layerIndex].features[this.selection.featureIndex];
    Object.assign(feature.properties, desc);
  }

  @modify()
  reset() {
    Object.assign(this, new State());
  }
}

export interface Geometry {
  type: 'polygon' | 'ellipse' | 'line' | 'brush' | 'door' | 'stairs'
  coordinates: number[][]
}

export type FeatureType = 'room' | 'wall' | 'text'

export interface FeatureProperties extends Description {
  type: FeatureType
}

export interface Feature {
  geometries: Geometry[]
  properties: FeatureProperties
}

export interface Layer {
  features: Feature[]
}

export interface Description {
  name?: string
  description?: string
}

export const Context = React.createContext(new State());
