import { mat3, mat4 } from 'gl-matrix';
import { Loop, Vertex, loadObj } from 'rb-phys2d';

import GEARS from './objects/gears.obj';
import HELIX from './objects/helix.obj';
import MECH from './objects/mech.obj';
import MESH from './objects/mesh.obj';
import PINBALL from './objects/pintball.obj';
import { GeometryData } from './services';

export const collection = loadObj(MECH);

const CROSS_SIZE = 0.08;

export const createGometry = (loop: Vertex): GeometryData => {
  const vertices = [];
  const indices = [];

  let index = 0;

  for (const vertex of Loop(loop)) {
    indices.push(index++, index++);
    vertices.push(...vertex.point, ...vertex.next.point);

    // debug info
    indices.push(index++, index++, index++, index++);
    vertices.push(
      -0.5 * CROSS_SIZE + vertex.point[0],
      vertex.point[1],
      0.5 * CROSS_SIZE + vertex.point[0],
      vertex.point[1],
      vertex.point[0],
      -0.5 * CROSS_SIZE + vertex.point[1],
      vertex.point[0],
      0.5 * CROSS_SIZE + vertex.point[1]
    );

    // indices.push(index++, index++);
    // vertices.push(
    //   ...vertex.point,
    //   vertex.point[0] + vertex.normal[0] * 0.1,
    //   vertex.point[1] + vertex.normal[1]* 0.1
    // );
  }

  return {
    vertexFormat: [
      {
        semantics: 'position',
        size: 2,
        type: WebGL2RenderingContext.FLOAT,
        slot: 0,
        offset: 0,
        stride: 8,
      },
    ],
    vertexData: Float32Array.from(vertices),
    indexData: Uint16Array.from(indices),
  };
};

export const toMat4 = (out: mat4, m: Readonly<mat3>): mat4 => {
  out.fill(0.0);

  out[0] = m[0];
  out[1] = m[1];

  out[4] = m[3];
  out[5] = m[4];

  out[12] = m[6];
  out[13] = m[7];
  out[15] = m[8];

  return out;
};
