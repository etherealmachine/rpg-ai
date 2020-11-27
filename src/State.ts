import React from 'react';
import { produce } from 'immer';

import { DoorPlacement, merge } from './lib';

let undoStack = [] as Map[];
let redoStack = [] as Map[];

function modify(options?: { undoable: boolean }) {
  return function (
    state: State,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const modifierFn = descriptor.value;
    descriptor.value = function () {
      const args = Array.from(arguments);
      (this as any).setState(produce(this, (newState: State) => {
        if (options && options.undoable) {
          undoStack.push(JSON.parse(JSON.stringify(newState.maps[newState.selection.mapIndex])));
          if (undoStack.length > 10) undoStack.splice(0, undoStack.length - 10);
        }
        modifierFn.bind(newState)(...args);
        if (newState.hasOwnProperty('notifyChange')) {
          newState.notifyChange();
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
  'decoration': {
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
  undo() {
    if (undoStack.length === 0) return;
    const prev = undoStack.pop();
    if (!prev) return;
    redoStack.push(JSON.parse(JSON.stringify(this.maps[this.selection.mapIndex])));
    if (redoStack.length > 10) redoStack.splice(0, undoStack.length - 10);
    this.maps[this.selection.mapIndex] = prev;
  }

  @modify()
  redo() {
    if (redoStack.length === 0) return;
    const prev = redoStack.pop();
    undoStack.push(JSON.parse(JSON.stringify(this.maps[this.selection.mapIndex])));
    if (undoStack.length > 10) undoStack.splice(0, undoStack.length - 10);
    if (prev) this.maps[this.selection.mapIndex] = prev;
  }

  @modify()
  toggleTodo() {
    this.showTodo = !this.showTodo;
  }

  @modify()
  newMap() {
    undoStack = [];
    redoStack = [];
    if (this.maps[this.maps.length - 1].name !== '' || this.maps[this.maps.length - 1].levels[0].features.length > 0) {
      this.maps.push({ name: '', description: '', levels: [{ features: [] }] });
    }
    this.selection = { mapIndex: this.maps.length - 1, levelIndex: 0, featureIndex: undefined, geometryIndex: undefined };
    this.scale = 1;
    this.offset = [0, 0];
  }

  @modify({ undoable: true })
  addLevel() {
    this.maps[this.selection.mapIndex].levels.push({
      features: []
    });
    this.selection.levelIndex = this.maps[this.selection.mapIndex].levels.length - 1;
    this.selection.featureIndex = undefined;
    this.selection.geometryIndex = undefined;
  }

  @modify()
  selectLevel(i: number) {
    this.selection.levelIndex = i;
    this.selection.featureIndex = undefined;
    this.selection.geometryIndex = undefined;
  }

  @modify({ undoable: true })
  removeLevel(i: number) {
    const levels = this.maps[this.selection.mapIndex].levels;
    if (levels.length <= 1) return;
    levels.splice(i, 1);
    if (this.selection.levelIndex === levels.length) {
      this.selection.levelIndex--;
    }
    this.selection.featureIndex = undefined;
    this.selection.geometryIndex = undefined;
  }

  @modify()
  setDebug(debug: boolean) {
    this.debug = debug;
  }

  @modify()
  setGridSteps(gridSteps: number) {
    this.gridSteps = gridSteps;
  }

  @modify({ undoable: true })
  handleDrag(from: number[], to: number[]) {
    if (from[0] === to[0] && from[1] === to[1]) return;
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const features = level.features;
    if (this.tools.stairs.selected) {
      features.push({
        properties: {
          type: 'wall',
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
          coordinates: [
            [from[0], from[1]],
            [to[0], from[1]],
            [to[0], to[1]],
            [from[0], to[1]],
            [from[0], from[1]]
          ],
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
          type: 'wall',
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

  @modify({ undoable: true })
  handlePolygon(points: number[][]) {
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const features = level.features;
    features.push({
      geometries: [{
        type: 'polygon',
        coordinates: points,
      }],
      properties: {
        type: this.tools.walls.selected ? 'room' : 'wall',
      },
    });
  }

  @modify({ undoable: true })
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

  @modify({ undoable: true })
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

  @modify({ undoable: true })
  addDoor(door: DoorPlacement) {
    const level = this.maps[this.selection.mapIndex].levels[this.selection.levelIndex];
    const feature = level.features[door.feature];
    feature.geometries.push({
      type: 'door',
      coordinates: [door.from, door.to],
    });
  }

  @modify({ undoable: true })
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
          type: ['polygon', 'ellipse'].includes(geom.type) ? 'room' : 'wall',
        },
        geometries: [geom],
      });
    } else {
      const geom1 = selectedFeature.geometries.find(geom => geom.type === 'polygon');
      const geom2 = features[featureIndex].geometries[geometryIndex];
      if (geom1 && geom2.type === 'polygon') {
        const mergedGeoms = merge(selectedFeature.geometries.filter(geom => geom.type === 'polygon'), geom2);
        const prevGeoms = selectedFeature.geometries.filter(geom => geom.type !== 'polygon');
        selectedFeature.geometries = prevGeoms.concat(mergedGeoms);
      } else {
        selectedFeature.geometries = selectedFeature.geometries.concat(features[featureIndex].geometries);
      }
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
    if (selection.mapIndex !== this.selection.mapIndex) {
      undoStack = [];
      redoStack = [];
    }
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

export type FeatureType = 'room' | 'wall' | 'text'

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
