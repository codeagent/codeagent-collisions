import { mat3, mat4, vec2 } from 'gl-matrix';
import { loadObj } from 'rb-phys2d';

import MECH from './objects/mech.obj';
import { GeometryData } from './services';

export const collection = loadObj(MECH);

export const createGometry = (loop: vec2[]): GeometryData => {
  const vertices = [];
  const indices = [];

  let index = 0;

  for (let i = 0; i < loop.length; i++) {
    const p0 = loop[i];
    const p1 = loop[(i + 1) % loop.length];

    indices.push(index++, index++);
    vertices.push(...p0, ...p1);
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
