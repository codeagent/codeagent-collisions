import { vec2 } from 'gl-matrix';

import { Mesh, MeshTriangle } from '../cd';

export interface MeshCollection {
  [name: string]: Mesh;
}

export const loadObj = (content: string) => {
  const positions: vec2[] = [];
  const collection: MeshCollection = {};
  let name = '';

  let triangles: MeshTriangle[] = [];
  const lines = content.split(/\r\n|\n/);
  const objectRegExp = /^o\s+(.+)/;
  const vertexRegExpr = /^v\s+([-0-9.]+)\s+([-0-9.]+)\s+([-0-9.]+)/;
  const faceRegExpr = /^f\s+/;
  const facePositionsRegExpr = /^f\s+(\d+)\s+(\d+)\s+(\d+)/;
  const facePositionsNormalsRegExpr =
    /^f\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)/;
  const faceFullRegExpr =
    /^f\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\/(\d+)\/(\d+)/;

  let matches;
  for (const line of lines) {
    if ((matches = line.match(objectRegExp))) {
      if (name !== '') {
        collection[name] = triangles;
        triangles = [];
      }
      name = matches[1].trim();
      continue;
    }

    if ((matches = line.match(vertexRegExpr))) {
      positions.push(vec2.fromValues(+matches[1], +matches[2]));
      continue;
    }

    if (line.match(faceRegExpr)) {
      // Only vertices were provided
      if ((matches = line.match(facePositionsRegExpr))) {
        const p0 = positions[+matches[1] - 1];
        const p1 = positions[+matches[2] - 1];
        const p2 = positions[+matches[3] - 1];
        triangles.push({ p0, p1, p2 });
      } // Positions and normals
      else if ((matches = line.match(facePositionsNormalsRegExpr))) {
        const p0 = positions[+matches[1] - 1];
        const p1 = positions[+matches[3] - 1];
        const p2 = positions[+matches[5] - 1];
        triangles.push({ p0, p1, p2 });
      } // Positions, normals and uvs
      else if ((matches = line.match(faceFullRegExpr))) {
        const p0 = positions[+matches[1] - 1];
        const p1 = positions[+matches[4] - 1];
        const p2 = positions[+matches[7] - 1];
        triangles.push({ p0, p1, p2 });
      } else {
        throw new Error('Unknown token');
      }
      continue;
    }
  }
  collection[name] = triangles;
  return collection;
};
