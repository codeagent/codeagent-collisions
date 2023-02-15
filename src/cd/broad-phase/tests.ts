import { vec2 } from 'gl-matrix';

import { closestPointsBetweenLineSegments } from '../../math';

const c0 = vec2.create();
const c1 = vec2.create();

export const testCapsuleCapsule = (
  p0: Readonly<vec2>,
  p1: Readonly<vec2>,
  radius0: number,
  q0: Readonly<vec2>,
  q1: Readonly<vec2>,
  radius1: number
): boolean => {
  closestPointsBetweenLineSegments(c0, c1, p0, p1, q0, q1);

  const r = radius0 + radius1;
  return vec2.squaredDistance(c0, c1) < r * r;
};
