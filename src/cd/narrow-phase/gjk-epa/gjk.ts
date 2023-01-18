import { vec2, vec3 } from 'gl-matrix';

import {
  closestPointToLineSegment,
  fromBarycentric,
  closestPointToTriangle,
  ORIGIN,
  SpaceMappingInterface,
} from '../../../math';
import { Convex } from '../../shape';

import { support } from './support';

export const distance = (
  simplex: Set<vec2>,
  shape0: Readonly<Convex>,
  shape1: Readonly<Convex>,
  spaceMapping: Readonly<SpaceMappingInterface>,
  initialDir: Readonly<vec2>,
  margin = 0,
  relError = 1.0e-2,
  maxIterations = 25
): number => {
  const e = Number.EPSILON * 1.0e4;
  const epsilon = 1.0e-4;
  const dir = vec2.clone(initialDir);
  const barycentric2 = vec2.create();
  const barycentric3 = vec3.create();

  let lower = Number.NEGATIVE_INFINITY;
  let upper = Number.POSITIVE_INFINITY;
  let last: vec2 = null;
  const max = 0;

  while (simplex.size != 3 && upper > e * max && maxIterations--) {
    vec2.negate(dir, dir);

    const s = vec2.create();
    support(s, shape0, shape1, spaceMapping, dir, margin);

    upper = vec2.dot(dir, dir);
    lower = -vec2.dot(dir, s);

    const theSame = last && last[0] === s[0] && last[1] === s[1];

    if (theSame || upper - lower <= relError * upper) {
      return Math.sqrt(upper);
    }

    last = s;
    simplex.add(s);

    if (simplex.size === 1) {
      const points = Array.from(simplex.values());
      vec2.copy(dir, points[0]);
    } else if (simplex.size === 2) {
      const points = Array.from(simplex.values());
      closestPointToLineSegment(barycentric2, points[0], points[1], ORIGIN);
      fromBarycentric(dir, barycentric2, points[0], points[1]);

      for (let i = 0; i < 2; i++) {
        if (barycentric2[i] < epsilon) {
          simplex.delete(points[i]);
        }
      }
    } else if (simplex.size === 3) {
      const points = Array.from(simplex.values());
      closestPointToTriangle(
        barycentric3,
        points[0],
        points[1],
        points[2],
        ORIGIN
      );
      fromBarycentric(dir, barycentric3, points[0], points[1], points[2]);

      for (let i = 0; i < 3; i++) {
        if (barycentric3[i] < epsilon) {
          simplex.delete(points[i]);
        }
      }
    } else {
      console.warn(
        'gjk.distance: for some reason simplex has more than 3 vertices'
      );
    }

    let max = 0;
    for (const point of simplex) {
      const dot = vec2.dot(point, point);
      if (dot > max) {
        max = dot;
      }
    }
  }

  return 0;
};

export const mdv = (mdv: vec2, simplex: Readonly<Set<vec2>>): void => {
  const barycentric2 = vec2.create();
  const barycentric3 = vec3.create();

  if (simplex.size === 1) {
    const p = Array.from(simplex.values());
    vec2.copy(mdv, p[0]);
  } else if (simplex.size == 2) {
    const p = Array.from(simplex.values());
    closestPointToLineSegment(barycentric2, p[0], p[1], ORIGIN);
    fromBarycentric(mdv, barycentric2, p[0], p[1]);
  } else if (simplex.size === 3) {
    const p = Array.from(simplex.values());
    closestPointToTriangle(barycentric3, p[0], p[1], p[2], ORIGIN);
    fromBarycentric(mdv, barycentric3, p[0], p[1], p[2]);
  } else {
    vec2.zero(mdv);
  }
};
