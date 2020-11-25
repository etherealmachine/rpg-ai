import React from 'react';
import { produce } from 'immer';
import { DoorPlacement } from './lib';

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
        if (newTarget.hasOwnProperty('notifyChange')) {
          newTarget.notifyChange();
        }
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
  maps = [{
    name: '',
    description: '',
    levels: [{
      features: [],
    }]
  }] as Map[]
  drawerOpen = false
  selection = {
    mapIndex: 0 as number,
    levelIndex: 0 as number,
    featureIndex: undefined as number | undefined,
    geometryIndex: undefined as number | undefined
  }
  gridSteps: number = 1
  debug = false
  showTodo = true
  setState = (state: any) => { }
  notifyChange = () => { }

  getSelectedFeature(): { feature: Feature, geometry: Geometry } | undefined {
    if (this.selection.featureIndex === undefined) return undefined;
    if (this.selection.geometryIndex === undefined) return undefined;
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const feature = level.features[this.selection.featureIndex];
    return {
      feature: feature,
      geometry: feature.geometries[this.selection.geometryIndex],
    };
  }

  @modify()
  save(mapName: string) {
    this.maps[this.selection.mapIndex].name = mapName;
    if (this.maps[this.maps.length - 1].name !== '' || this.maps[this.maps.length - 1].levels[0].features.length > 0) {
      this.maps.push({ name: '', description: '', levels: [{ features: [] }] });
    }
  }

  @modify()
  toggleTodo() {
    this.showTodo = !this.showTodo;
  }

  @modify()
  newMap() {
    if (this.maps[this.maps.length - 1].name !== '' || this.maps[this.maps.length - 1].levels[0].features.length > 0) {
      this.maps.push({ name: '', description: '', levels: [{ features: [] }] });
    }
    this.selection = { mapIndex: this.maps.length - 1, levelIndex: 0, featureIndex: undefined, geometryIndex: undefined };
    this.scale = 1;
    this.offset = [0, 0];
  }

  @modify()
  setDebug(debug: boolean) {
    this.debug = debug;
  }

  @modify()
  setGridSteps(gridSteps: number) {
    this.gridSteps = gridSteps;
  }

  @modify()
  handleDrag(from: number[], to: number[]) {
    if (from[0] === to[0] && from[1] === to[1]) return;
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const features = level.features;
    if (this.tools.stairs.selected) {
      features.push({
        properties: {
          type: 'geometry',
        },
        geometries: [{
          type: 'stairs',
          coordinates: [from, to],
        }],
      });
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
    } else if (this.tools.walls.selected) {
      features.push({
        geometries: [{
          type: 'line',
          coordinates: [from, to],
        }],
        properties: {
          type: 'geometry',
        },
      });
    } else if (this.selection.featureIndex !== undefined) {
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
  }

  @modify()
  handlePolygon(points: number[][]) {
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const features = level.features;
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
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const features = level.features;
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
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const features = level.features;
    if (this.selection.featureIndex === undefined) return;
    if (this.selection.geometryIndex === undefined) return;
    const feature = features[this.selection.featureIndex];
    if (this.selection.geometryIndex === 0 || feature.geometries.length === 1) {
      features.splice(this.selection.featureIndex, 1);
    } else {
      feature.geometries.splice(this.selection.geometryIndex, 1);
    }
    this.selection.featureIndex = undefined;
    this.selection.geometryIndex = undefined;
  }

  @modify()
  addDoor(door: DoorPlacement) {
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const feature = level.features[door.feature];
    feature.geometries.push({
      type: 'door',
      coordinates: [door.from, door.to],
    });
  }

  @modify()
  handleGroup(featureIndex: number, geometryIndex: number) {
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const features = level.features;
    if (this.selection.featureIndex === undefined) return;
    if (this.selection.geometryIndex === undefined) return;
    const selectedFeature = features[this.selection.featureIndex];
    if (this.selection.featureIndex === featureIndex) {
      if (selectedFeature.geometries.length === 1) return;
      const geom = selectedFeature.geometries[geometryIndex];
      selectedFeature.geometries.splice(geometryIndex, 1);
      features.push({
        properties: {
          type: ['polygon', 'ellipse'].includes(geom.type) ? 'room' : 'geometry',
        },
        geometries: [geom],
      });
    } else {
      selectedFeature.geometries = selectedFeature.geometries.concat(features[featureIndex].geometries);
      features.splice(featureIndex, 1);
      if (this.selection.featureIndex > featureIndex) this.selection.featureIndex--;
    }
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
  setSelection(selection: { mapIndex: number, levelIndex: number, featureIndex: undefined | number, geometryIndex: undefined | number }) {
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
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const feature = level.features[this.selection.featureIndex];
    Object.assign(feature.properties, desc);
  }

  @modify()
  reset() {
    Object.assign(this, new State());
  }
}

export interface Map {
  name: string
  description: string
  levels: Level[]
}

export interface Geometry {
  type: 'polygon' | 'ellipse' | 'line' | 'brush' | 'door' | 'stairs'
  coordinates: number[][]
}

export type FeatureType = 'room' | 'geometry' | 'text'

export interface FeatureProperties extends Description {
  type: FeatureType
}

export interface Feature {
  geometries: Geometry[]
  properties: FeatureProperties
}

export interface Level {
  features: Feature[]
}

export interface Description {
  name?: string
  description?: string
}

export const Context = React.createContext(new State());
