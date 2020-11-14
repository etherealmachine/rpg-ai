import React from 'react';
import { produce } from 'immer';

// import * as martinez from 'martinez-polygon-clipping';

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

const initialTools = {
  'pointer': {
    selected: true,
    group: 1,
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
  'text': {
    selected: false,
    group: 1,
    polygon: false,
    disabled: false,
  },
  'eraser': {
    selected: false,
    group: 1,
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
}

export type ToolName = keyof typeof initialTools;

export class State {
  tools = initialTools
  scale = 1
  offset = { x: 0, y: 0 }
  layers = [{
    features: [],
  }] as Layer[]
  drawerOpen = true
  selection = {
    layerIndex: 0 as number,
    featureIndex: undefined as number | undefined
  }
  debug = false
  setState = (state: any) => { }

  getSelectedFeature() {
    if (this.selection.featureIndex === undefined) return undefined;
    return this.layers[this.selection.layerIndex].features[this.selection.featureIndex];
  }

  @modify()
  setDebug(debug: boolean) {
    this.debug = debug;
  }

  @modify()
  handleRect(from: Pos, to: Pos) {
    const features = this.layers[this.selection.layerIndex].features;
    if (this.tools.rect.selected && from.x !== to.x && from.y !== to.y) {
      const coordinates = [[[from.x, from.y], [from.x, to.y], [to.x, to.y], [to.x, from.y], [from.x, from.y]]];
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: coordinates,
        },
        properties: {},
      });
    } else if (this.tools.ellipse.selected && from.x !== to.x && from.y !== to.y) {
      features.push({
        type: "Feature",
        geometry: {
          type: "MultiPoint",
          coordinates: [[from.x, from.y], [to.x, to.y]],
        },
        properties: {},
      });
    }
  }

  @modify()
  handlePolygon(points: Pos[]) {
    const features = this.layers[this.selection.layerIndex].features;
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [points.map(p => [p.x, p.y])],
      },
      properties: {},
    });
  }

  @modify()
  setSelectedTool(name: ToolName) {
    const tool = this.tools[name];
    if (tool.selected) {
      tool.selected = false;
      return;
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
    if (this.selection.featureIndex === undefined) return;
    const feature = this.layers[this.selection.layerIndex].features[this.selection.featureIndex];
    if (feature.properties) {
      feature.properties["description"] = desc;
    } else {
      feature.properties = {
        'description': desc
      };
    }
  }

  @modify()
  reset() {
    Object.assign(this, new State());
  }
}

export interface Pos {
  x: number
  y: number
}

export interface Layer {
  features: GeoJSON.Feature[]
}

export interface Description {
  name: string
  description: string
}

export const Context = React.createContext(new State());
