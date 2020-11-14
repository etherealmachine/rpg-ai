import React from 'react';
import { produce } from 'immer';

import * as martinez from 'martinez-polygon-clipping';

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
  addRoomFromRect(from: Pos, to: Pos) {
    const coordinates = [[[from.x, from.y], [from.x, to.y], [to.x, to.y], [to.x, from.y], [from.x, from.y]]];
    const features = this.layers[this.selection.layerIndex].features;
    if (features.length === 0) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: coordinates,
        },
        properties: {},
      });
    } else {
      const merged = martinez.union(features[0].geometry.coordinates, coordinates);
      features[0].geometry.coordinates = [merged[0][0] as number[][]];
    }
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
  features: GeoJSON.Feature<GeoJSON.Polygon, GeoJSON.GeoJsonProperties>[]
}

export interface Description {
  name: string
  description: string
}

export const Context = React.createContext(new State());
