import ClingoService from '../ClingoService';
import { Tilemap } from '../Tiled';

import Parser from './Parser';

const Program = `
1 { assign(X,Y,P):pattern(P) } 1 :- cell(X,Y).
:- adj(X1,Y1,X2,Y2,DX,DY),
assign(X1,Y1,P1),
not 1 { assign(X2,Y2,P2):legal(DX,DY,P1,P2) }.

#show assign/3.
`;

export default class Generator {

  parser: Parser
  targetWidth: number
  targetHeight: number
  assignments: (number | undefined)[]

  constructor(parser: Parser, targetWidth: number, targetHeight: number) {
    this.parser = parser;
    this.targetWidth = targetWidth;
    this.targetHeight = targetHeight;
    this.assignments = new Array(targetWidth * targetHeight);
  }

  async generate(): Promise<Tilemap> {
    const cells = `cell(0..${this.targetWidth - 1},0..${this.targetHeight - 1}).`;
    const adj: string[] = [];
    for (let x = 0; x < this.targetWidth; x++) {
      for (let y = 0; y < this.targetHeight; y++) {
        for (let delta of this.parser.neighbors.values()) {
          const [nx, ny] = [x + delta.x, y + delta.y];
          if (nx < 0 || nx >= this.targetWidth || ny < 0 || ny >= this.targetHeight) continue;
          adj.push(`adj(${x},${y},${nx},${ny},${delta.x},${delta.y}).`);
        }
      }
    }

    const patterns = `pattern(0..${this.parser.patterns.length - 1}).`;
    const legal: string[] = [];
    for (let [p1, directions] of this.parser.compatible.entries()) {
      for (let [direction, patterns] of directions.entries()) {
        const delta = this.parser.neighbors.get(direction);
        if (delta === undefined) throw Error(`No delta found for direction ${direction}`);
        for (let p2 of patterns) {
          legal.push(`legal(${delta.x},${delta.y},${p1},${p2}).`);
        }
      }
    }

    const assignments = [];
    for (let x = 0; x < this.targetWidth; x++) {
      for (let y = 0; y < this.targetHeight; y++) {
        const assignedPatternIndex = this.assignments[y * this.targetWidth + x];
        if (assignedPatternIndex !== undefined) {
          assignments.push(`assign(${x}, ${y}, ${assignedPatternIndex}).`);
        }
      }
    }

    const resp = await ClingoService.RunProgram({
      Program: [
        cells,
        ...adj,
        patterns,
        ...legal,
        ...assignments,
        Program,
      ].join('\n')
    });

    return new Promise((resolve, reject) => {
      const match = resp.Stdout.match(/Answer:\W+1\W+(.*)\W+SATISFIABLE/);
      if (match !== null && match.length === 2) {
        const atoms = match[1].split(' ');
        const newTilemap = JSON.parse(JSON.stringify(this.parser.tilemap)) as Tilemap;
        newTilemap.width = this.targetWidth;
        newTilemap.height = this.targetHeight;
        for (let layer of newTilemap.layers) {
          layer.data = new Array(this.targetWidth * this.targetHeight);
          layer.width = this.targetWidth;
          layer.height = this.targetHeight;
        }

        for (let atom of atoms) {
          const match = atom.match(/assign\((\d+),\W*(\d+),\W*(\d+)\)/);
          if (match === null) throw new Error(`No match found for ${atom}`);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [x, y, p] = match.slice(1, 4).map(x => parseInt(x));
          this.assignments[y * this.targetWidth + x] = p;
          this.parser.tiles[this.parser.patterns[p][0]].split(',').map(x => parseInt(x)).forEach((tile, layer) => {
            const data = newTilemap.layers[layer].data;
            if (!data) return;
            data[y * this.targetWidth + x] = tile;
          });
        }
        resolve(newTilemap);
      } else {
        console.log(match);
        reject(resp.Stderr);
      }
    });
  }

}