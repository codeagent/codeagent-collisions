import { mat3, vec2 } from 'gl-matrix';

export type AABB = [vec2, vec2];

const p = vec2.create();

export const getAABBFromSupport = (
  out: AABB,
  support: (out: vec2, dir: Readonly<vec2>) => vec2,
  transform: Readonly<mat3>
): AABB => {
  // top
  vec2.set(p, transform[1], transform[4]);
  support(p, p);
  vec2.transformMat3(p, p, transform);
  out[1][1] = p[1];

  // right
  vec2.set(p, transform[0], transform[3]);
  support(p, p);
  vec2.transformMat3(p, p, transform);
  out[1][0] = p[0];

  // bottom
  vec2.set(p, -transform[1], -transform[4]);
  support(p, p);
  vec2.transformMat3(p, p, transform);
  out[0][1] = p[1];

  // right
  vec2.set(p, -transform[0], -transform[3]);
  support(p, p);
  vec2.transformMat3(p, p, transform);
  out[0][0] = p[0];

  return out;
};
